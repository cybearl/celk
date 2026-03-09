import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { ConfigSelectModel } from "@app/db/schema/config"
import { getEnabledAddressLists } from "@app/queries/addressLists"
import { getConfig } from "@app/queries/config"

class WorkersManager {
    private _workers: Map<string, string>
    private _pollTimeout: ReturnType<typeof setTimeout> | null
    private _isSyncing: boolean

    constructor() {
        this._workers = new Map()
        this._pollTimeout = null
        this._isSyncing = false
    }

    private async _startWorker() {
        //
    }

    private async _stopWorker() {
        //
    }

    private _clearTimeout() {
        if (this._pollTimeout) clearTimeout(this._pollTimeout)
        this._pollTimeout = null
    }

    private async _sync() {
        if (this._isSyncing) return
        this._isSyncing = true

        let config: ConfigSelectModel | null = null
        let enabledAddressLists: AddressListSelectModel[] = []

        try {
            const [fetchedConfig, fetchedEnabledAddressLists] = await Promise.all([
                getConfig(),
                getEnabledAddressLists(),
            ])

            config = fetchedConfig
            enabledAddressLists = fetchedEnabledAddressLists
        } catch (error) {
            console.error("An error occurred while fetching config or address lists:", error)

            this._isSyncing = false
            this._clearTimeout()

            return
        }

        try {
            console.log("Syncing workers with config:", config, "and address lists:", enabledAddressLists)
        } finally {
            setTimeout(() => this._sync(), config.workerPollIntervalMs)
            this._isSyncing = false
        }
    }

    async start() {
        await this._sync()
    }

    stop() {
        this._clearTimeout()
    }
}

// Using a global variable to keeping the same class instance in development (hot-reload)
const globalWorkersManager = global as unknown as { workersManager: WorkersManager | undefined }

/**
 * The workers manager instance, either from the global variable or a new instance.
 */
export const workersManager = globalWorkersManager.workersManager ?? new WorkersManager()
