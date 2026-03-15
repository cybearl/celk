import type { ChildProcessWithoutNullStreams } from "node:child_process"
import fs from "node:fs"
import WORKERS_CONFIG from "@app/config/workers"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { ConfigSelectModel } from "@app/db/schema/config"
import { logger } from "@app/lib/base/utils/logger"
import { sendSyncFailureAlert } from "@app/lib/server/utils/emails"
import { spawnWorker, stopWorker } from "@app/workers/lib/controls"
import {
    deleteAddressListDumpFile,
    deleteAddressListDumpMetadataFile,
    getAddressListDumpFilePath,
    getAddressListIdsFromDumpFiles,
    saveAddressListDumpFiles,
} from "@app/workers/lib/dumps"
import { getAppConfig, getEnabledAddressLists } from "@app/workers/lib/queries"
import { getRetryDelay } from "@app/workers/lib/time"

class WorkersManager {
    private _isSyncing: boolean
    private _syncRetryCount: number
    private _hasSyncAlertBeenSent: boolean

    /**
     * The logger for the synchronization process, uses the first 8 chars
     * to keep log lines aligned with worker logs that use the first 8
     * chars of the address list ID as prefix.
     */
    private readonly _syncLogger = logger.withPrefix("W-SYNCHRON")

    private _config: ConfigSelectModel | null
    private _enabledAddressLists: AddressListSelectModel[] | null
    private _pollTimeout: ReturnType<typeof setTimeout> | null
    private _workers: Map<string, ChildProcessWithoutNullStreams>

    constructor() {
        this._isSyncing = false
        this._syncRetryCount = 0
        this._hasSyncAlertBeenSent = false

        this._config = null
        this._enabledAddressLists = null
        this._pollTimeout = null
        this._workers = new Map()
    }

    /**
     * Clears the timeout for the worker polling.
     */
    private _clearTimeout(): void {
        if (this._pollTimeout) clearTimeout(this._pollTimeout)
        this._pollTimeout = null
    }

    /**
     * Retrieves all required data in parallel during synchronization.
     */
    private async _fetchRequiredData(): Promise<void> {
        const [config, enabledAddressLists] = await Promise.all([getAppConfig(), getEnabledAddressLists()])
        this._config = config
        this._enabledAddressLists = enabledAddressLists
    }

    /**
     * Synchronizes the worker state with the latest config and address lists.
     * @returns A promise that resolves when the synchronization is complete.
     */
    private async _sync(): Promise<void> {
        if (this._isSyncing) return
        this._isSyncing = true

        try {
            await this._fetchRequiredData()

            if (!this._config) {
                throw new Error("An error occurred while fetching the application config.")
            }

            if (!this._enabledAddressLists) {
                throw new Error("An error occurred while fetching the enabled address lists.")
            }

            for (const enabledAddressList of this._enabledAddressLists) {
                await saveAddressListDumpFiles(enabledAddressList)
            }

            const addressListIdsFromDumpFiles = getAddressListIdsFromDumpFiles()

            // Delete all files that are not attached to an enabled address list
            for (const addressListId of addressListIdsFromDumpFiles) {
                if (!this._enabledAddressLists.some(list => list.id === addressListId)) {
                    deleteAddressListDumpFile(addressListId)
                    deleteAddressListDumpMetadataFile(addressListId)
                }
            }

            // Collecting entries before any mutation
            const workerEntries = Array.from(this._workers.entries())

            // Stop workers whose address list is no longer enabled
            for (const [addressListId, worker] of workerEntries) {
                if (!this._enabledAddressLists.some(list => list.id === addressListId)) {
                    stopWorker(worker, addressListId)
                    this._workers.delete(addressListId)
                }
            }

            // Spawn or restart workers for each enabled address list
            for (const enabledAddressList of this._enabledAddressLists) {
                const existingWorker = this._workers.get(enabledAddressList.id)

                if (existingWorker) {
                    if (existingWorker.exitCode === null && !existingWorker.killed) continue

                    // Removing it from the map if it's there but dead
                    this._workers.delete(enabledAddressList.id)
                }

                // Only spawn if a dump exists on disk (list may have no addresses)
                if (!fs.existsSync(getAddressListDumpFilePath(enabledAddressList.id))) continue

                const worker = spawnWorker(enabledAddressList, this._config.workerReportIntervalMs)
                this._workers.set(enabledAddressList.id, worker)

                // Clean up the map entry when the worker exits, unless it was already replaced
                worker.once("exit", () => {
                    if (this._workers.get(enabledAddressList.id) === worker) {
                        this._workers.delete(enabledAddressList.id)
                    }
                })
            }

            // Reset retry states
            this._syncRetryCount = 0
            this._hasSyncAlertBeenSent = false

            // Loop for next sync
            this._pollTimeout = setTimeout(() => this._sync(), this._config.workerPollIntervalMs)
            this._isSyncing = false
        } catch (error) {
            this._syncRetryCount++

            const maxRetries = this._config?.maxSyncRetries ?? WORKERS_CONFIG.syncRetry.maxRetries

            this._syncLogger.error(
                `An error occurred while fetching data during sync (attempt ${this._syncRetryCount})`,
                { data: error },
            )

            if (this._syncRetryCount >= maxRetries && !this._hasSyncAlertBeenSent) {
                try {
                    await sendSyncFailureAlert(this._syncRetryCount, error)
                    this._hasSyncAlertBeenSent = true
                } catch (error) {
                    this._syncLogger.error(`Failed to send sync failure alert`, { data: error })
                }
            }

            const retryDelay = getRetryDelay(this._config, this._syncRetryCount)
            this._syncLogger.info(`Retrying sync in ${retryDelay}ms...`)

            this._isSyncing = false
            this._clearTimeout()
            this._pollTimeout = setTimeout(() => this._sync(), retryDelay)
        }
    }

    /**
     * Starting procedure for the workers manager.
     */
    async start(): Promise<void> {
        await this._sync()
    }

    /**
     * Stops the workers manager and all running workers.
     */
    stop(): void {
        this._clearTimeout()

        for (const [addressListId, worker] of this._workers.entries()) {
            stopWorker(worker, addressListId)
        }
    }
}

// Using a global variable to keep the same class instance in development (hot-reload)
const globalWorkersManager = global as unknown as { workersManager: WorkersManager | undefined }

/**
 * The workers manager instance, either from the global variable or a new instance.
 */
export const workersManager = globalWorkersManager.workersManager ?? new WorkersManager()

// Writing back to the global variable
if (process.env.NODE_ENV !== "production") globalWorkersManager.workersManager = workersManager
