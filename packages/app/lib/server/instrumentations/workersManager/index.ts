import type { ChildProcessWithoutNullStreams } from "node:child_process"
import fs from "node:fs"
import DYNAMIC_CONFIG from "@app/config/dynamicConfig"
import { PUBLIC_ENV } from "@app/config/env"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import type { UserOptionsSelectModel } from "@app/db/schema/userOptions"
import { logger } from "@app/lib/base/utils/logger"
import { spawnWorker, stopWorker } from "@app/lib/server/instrumentations/workersManager/lib/controls"
import {
    deleteAddressListDumpFile,
    deleteAddressListDumpMetadataFile,
    getAddressListDumpFilePath,
    getAddressListIdsFromDumpFiles,
    saveAddressListDumpFiles,
} from "@app/lib/server/instrumentations/workersManager/lib/dumps"
import { sendWorkersManagerSyncFailureAlert } from "@app/lib/server/utils/emails"
import { dbGetDynamicConfig, dbGetEnabledAddressLists, dbGetUserOptionsByUserIds } from "@app/lib/server/utils/queries"
import { getWorkersManagerRetryDelay } from "@app/lib/server/utils/time"

class WorkersManager {
    /**
     * The logger for the workers manager, aligned with the worker logger
     * that uses the format `<W-XXXXXXXX>`.
     */
    private readonly _workersManagerLogger = logger.withPrefix("W-SYNCHRON")

    private _dynamicConfig: DynamicConfigSelectModel | null
    private _enabledAddressLists: AddressListSelectModel[] | null
    private _userOptionsMap: Map<string, UserOptionsSelectModel>
    private _pollTimeout: ReturnType<typeof setTimeout> | null
    private _workers: Map<string, ChildProcessWithoutNullStreams>

    private _isSyncing: boolean
    private _syncRetryCount: number
    private _hasSyncAlertBeenSent: boolean

    constructor() {
        this._dynamicConfig = null
        this._enabledAddressLists = null
        this._userOptionsMap = new Map()
        this._pollTimeout = null
        this._workers = new Map()

        this._isSyncing = false
        this._syncRetryCount = 0
        this._hasSyncAlertBeenSent = false
    }

    /**
     * Clear the timeout for the worker polling.
     */
    private _clearTimeout(): void {
        if (this._pollTimeout) clearTimeout(this._pollTimeout)
        this._pollTimeout = null
    }

    /**
     * Retrieve all required data in parallel during synchronization.
     */
    private async _fetchRequiredData(): Promise<void> {
        const [dynamicConfig, enabledAddressLists] = await Promise.all([
            dbGetDynamicConfig(),
            dbGetEnabledAddressLists(),
        ])

        this._dynamicConfig = dynamicConfig
        this._enabledAddressLists = enabledAddressLists

        const userIds = [...new Set(enabledAddressLists.map(list => list.userId))]
        this._userOptionsMap = await dbGetUserOptionsByUserIds(userIds)
    }

    /**
     * Synchronize the worker state with the latest config and address lists.
     */
    private async _sync(): Promise<void> {
        if (this._isSyncing) return
        this._isSyncing = true

        try {
            await this._fetchRequiredData()

            if (!this._dynamicConfig) {
                throw new Error("An error occurred while fetching the dynamic application config.")
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

                const userOptions = this._userOptionsMap.get(enabledAddressList.userId) ?? null

                const worker = spawnWorker(enabledAddressList, this._dynamicConfig.workerReportIntervalMs, userOptions)
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
            this._pollTimeout = setTimeout(() => this._sync(), this._dynamicConfig.workersManagerPollIntervalMs)
            this._isSyncing = false
        } catch (error) {
            this._syncRetryCount++

            const maxRetries =
                this._dynamicConfig?.maxWorkersManagerSyncRetries ?? DYNAMIC_CONFIG.maxWorkersManagerSyncRetries

            this._workersManagerLogger.error(
                `An error occurred while fetching data during sync (attempt ${this._syncRetryCount})`,
                { data: error },
            )

            if (this._syncRetryCount >= maxRetries && !this._hasSyncAlertBeenSent) {
                try {
                    await sendWorkersManagerSyncFailureAlert(this._syncRetryCount, error)
                    this._hasSyncAlertBeenSent = true
                } catch (error) {
                    this._workersManagerLogger.error(`Failed to send sync failure alert`, { data: error })
                }
            }

            const retryDelay = getWorkersManagerRetryDelay(this._dynamicConfig, this._syncRetryCount)
            this._workersManagerLogger.info(`Retrying sync in ${retryDelay.toLocaleString("en-US")}ms...`)

            this._isSyncing = false
            this._clearTimeout()
            this._pollTimeout = setTimeout(() => this._sync(), retryDelay)
        }
    }

    /**
     * Starting procedure for the workers manager.
     */
    async start(): Promise<void> {
        this._workersManagerLogger.info(`Starting workers manager...`)
        await this._sync()
    }

    /**
     * Stop the workers manager and all running workers.
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
if (PUBLIC_ENV.nodeEnv !== "production") globalWorkersManager.workersManager = workersManager
