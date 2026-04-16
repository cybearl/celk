import DYNAMIC_CONFIG from "@app/config/dynamicConfig"
import { PRIVATE_ENV, PUBLIC_ENV } from "@app/config/env"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import type { UserOptionsSelectModel } from "@app/db/schema/userOptions"
import { logger } from "@app/lib/base/utils/logger"
import { generateAddressDumps } from "@app/lib/server/instrumentations/workersOrchestrator/lib/addresses"
import { generateWorkerLoggerPrefix } from "@app/lib/server/instrumentations/workersOrchestrator/lib/formats"
import { saveMatchLocally } from "@app/lib/server/instrumentations/workersOrchestrator/lib/matches"
import { sendMatchAlert, sendWorkersManagerSyncFailureAlert } from "@app/lib/server/utils/emails"
import { encryptPrivateKey } from "@app/lib/server/utils/encryption"
import {
    dbAutoDisableAddressListIfAllMatched,
    dbCalculateAverageAddressListHashRate,
    dbDisableAddressList,
    dbGetAddressesByAddressListId,
    dbGetAddressListWithUser,
    dbGetDynamicConfig,
    dbGetEnabledAddressLists,
    dbGetUserOptionsByUserIds,
    dbIncrementAttemptCounts,
    dbSaveWorkerMatchToDb,
    dbUpdateClosestMatches,
} from "@app/lib/server/utils/queries"
import { getWorkersManagerRetryDelay } from "@app/lib/server/utils/time"
import {
    type AnyIncomingWorkerMessage,
    type StartWorkerMessage,
    type StopWorkerMessage,
    WORKER_MESSAGE_TYPE,
    type WorkerMessage,
} from "@cybearl/celk-protocol"
import amqplib from "amqplib"

/**
 * Inferred connection type from `amqplib.connect()`, avoids conflicts between
 * bundled and `@types/amqplib` definitions.
 */
type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>

/**
 * Inferred channel type from `AmqpConnection.createChannel()`, avoids conflicts
 * between bundled and `@types/amqplib` definitions.
 */
type AmqpChannel = Awaited<ReturnType<AmqpConnection["createChannel"]>>

class WorkersOrchestrator {
    private readonly _logger = logger.withPrefix("W-ORCHESTR")

    private _connection: AmqpConnection | null
    private _publishChannel: AmqpChannel | null
    private _consumeChannel: AmqpChannel | null

    private _dynamicConfig: DynamicConfigSelectModel | null
    private _lastDynamicConfigUpdatedAt: Date | null
    private _enabledAddressLists: AddressListSelectModel[] | null
    private _userOptionsMap: Map<string, UserOptionsSelectModel>
    private _activeListIds: Set<string>
    private _pollTimeout: ReturnType<typeof setTimeout> | null

    private _isSyncing: boolean
    private _syncRetryCount: number
    private _hasSyncAlertBeenSent: boolean

    constructor() {
        this._connection = null
        this._publishChannel = null
        this._consumeChannel = null

        this._dynamicConfig = null
        this._lastDynamicConfigUpdatedAt = null
        this._enabledAddressLists = null
        this._userOptionsMap = new Map()
        this._activeListIds = new Set()
        this._pollTimeout = null

        this._isSyncing = false
        this._syncRetryCount = 0
        this._hasSyncAlertBeenSent = false
    }

    /**
     * Clears the timeout for the worker polling.
     */
    private _clearTimeout(): void {
        if (this._pollTimeout) clearTimeout(this._pollTimeout)
        this._pollTimeout = null
    }

    /**
     * Connects to RabbitMQ, asserts both queues, and starts consuming events.
     */
    private async _connectRabbitMQ(): Promise<void> {
        this._connection = await amqplib.connect(PRIVATE_ENV.rabbitmq.url)
        this._publishChannel = await this._connection.createChannel()
        this._consumeChannel = await this._connection.createChannel()

        await this._publishChannel.assertQueue(PRIVATE_ENV.rabbitmq.workerCommandsQueue, { durable: true })
        await this._consumeChannel.assertQueue(PRIVATE_ENV.rabbitmq.workerEventsQueue, { durable: true })

        await this._consumeChannel.consume(PRIVATE_ENV.rabbitmq.workerEventsQueue, msg => {
            if (!msg) return
            this._consumeChannel!.ack(msg)

            let message: AnyIncomingWorkerMessage
            try {
                message = JSON.parse(msg.content.toString()) as AnyIncomingWorkerMessage
            } catch {
                this._logger.error("Failed to parse incoming worker event")
                return
            }

            this._routeEvent(message)
        })
    }

    /**
     * Publishes a command message to the commands queue.
     * @param message The command message to publish.
     */
    private _publish(message: StartWorkerMessage | StopWorkerMessage): void {
        if (!this._publishChannel) return

        this._publishChannel.sendToQueue(
            PRIVATE_ENV.rabbitmq.workerCommandsQueue,
            Buffer.from(JSON.stringify(message)),
            { persistent: true },
        )
    }

    /**
     * Routes an incoming event from the events queue to the appropriate handler.
     * @param message The event message received from the runner.
     */
    private _routeEvent(message: AnyIncomingWorkerMessage): void {
        const workerLogger = logger.withPrefix(generateWorkerLoggerPrefix(message.addressListId))

        switch (message.type) {
            case WORKER_MESSAGE_TYPE.Heartbeat:
                // Heartbeats are handled locally by the runner, not forwarded
                break

            case WORKER_MESSAGE_TYPE.Report:
                // Increments the attempt counts for the address list
                dbIncrementAttemptCounts(message.attempts, message.addressListId).catch(error => {
                    workerLogger.error("Failed to increment attempt counts:", { data: error })
                })

                // Updates the closest matches for the address list
                dbUpdateClosestMatches(message.addressListId, message.closestMatches).catch(error => {
                    workerLogger.error("Failed to update closest matches:", { data: error })
                })

                // Calculates the average hash rate for the address list
                dbCalculateAverageAddressListHashRate(message.attempts, message.addressListId).catch(error => {
                    workerLogger.error("Failed to update average hash rate:", { data: error })
                })

                break

            case WORKER_MESSAGE_TYPE.Match: {
                let encryptedPrivateKey: string
                try {
                    encryptedPrivateKey = encryptPrivateKey(message.privateKey)
                } catch (error) {
                    workerLogger.error("Failed to encrypt private key:", { data: error })
                    break
                }

                // Local trace first (synchronous, survives DB failure)
                try {
                    saveMatchLocally({
                        addressListId: message.addressListId,
                        address: message.address,
                        encryptedPrivateKey,
                        totalAttempts: message.totalAttempts,
                        matchedAt: new Date().toISOString(),
                    })
                } catch (error) {
                    workerLogger.error("Failed to save match locally:", { data: error })
                }

                // Try to save the match to the database (non-blocking)
                dbSaveWorkerMatchToDb(message.addressListId, message.address, encryptedPrivateKey)
                    .then(() => dbAutoDisableAddressListIfAllMatched(message.addressListId))
                    .catch(error => {
                        workerLogger.error("Failed to save match to DB or auto-disable address list:", { data: error })
                    })

                // Fetch the address list with user information
                dbGetAddressListWithUser(message.addressListId)
                    .then(result => {
                        if (!result) {
                            workerLogger.error("Address list not found for match alert, skipping email.")
                            return
                        }

                        // Sends a match alert email to the user
                        sendMatchAlert({
                            user: result.user,
                            addressListName: result.addressList.name,
                            address: message.address,
                            totalAttempts: message.totalAttempts,
                        }).catch(error => {
                            workerLogger.error("Failed to send match alert email:", { data: error })
                        })
                    })
                    .catch(error => {
                        workerLogger.error("Failed to fetch address list owner for match alert:", { data: error })
                    })

                // If the "stop on first match" option is enabled for this address list, disable it
                if (message.stopOnFirstMatch) {
                    dbDisableAddressList(message.addressListId).catch(error => {
                        workerLogger.error("Failed to disable address list (via stop on first match):", { data: error })
                    })
                }

                break
            }

            case WORKER_MESSAGE_TYPE.Error:
                workerLogger.error(`Worker error: ${message.message}`)

                // Runner publishes this on unexpected exit, remove from active set so
                // the next poll re-issues a start message if the list is still enabled
                this._activeListIds.delete(message.addressListId)

                break

            default:
                workerLogger.error(`Unknown message type: ${(message as WorkerMessage).type}`)
        }
    }

    /**
     * Retrieves all required data in parallel during synchronization.
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
     * Synchronizes the worker state with the latest config and address lists.
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

            // If the dynamic config changed since the last poll, stop all active workers so they
            // restart fresh with the updated settings on this same cycle
            if (
                this._lastDynamicConfigUpdatedAt !== null &&
                this._dynamicConfig.updatedAt.getTime() !== this._lastDynamicConfigUpdatedAt.getTime()
            ) {
                for (const addressListId of this._activeListIds) {
                    this._publish({
                        type: WORKER_MESSAGE_TYPE.Stop,
                        addressListId,
                    })
                }

                this._activeListIds.clear()
            }

            this._lastDynamicConfigUpdatedAt = this._dynamicConfig.updatedAt

            // Stop workers whose address list is no longer enabled
            for (const addressListId of [...this._activeListIds]) {
                if (!this._enabledAddressLists.some(list => list.id === addressListId)) {
                    this._publish({
                        type: WORKER_MESSAGE_TYPE.Stop,
                        addressListId,
                    })

                    this._activeListIds.delete(addressListId)
                }
            }

            // Start workers for enabled address lists not yet active
            for (const enabledAddressList of this._enabledAddressLists) {
                if (this._activeListIds.has(enabledAddressList.id)) continue

                const addresses = await dbGetAddressesByAddressListId(enabledAddressList.id, false)
                if (!addresses || addresses.length === 0) continue

                const userOptions = this._userOptionsMap.get(enabledAddressList.userId)

                const startMessage: StartWorkerMessage = {
                    type: WORKER_MESSAGE_TYPE.Start,
                    addressListId: enabledAddressList.id,
                    reportIntervalMs: this._dynamicConfig.workerReportIntervalMs,
                    heartbeatIntervalMs: this._dynamicConfig.workerHeartbeatIntervalMs,
                    heartbeatTimeoutMs: this._dynamicConfig.workerHeartbeatTimeoutMs,
                    stopOnFirstMatch: enabledAddressList.stopOnFirstMatch,
                    userOptions: {
                        autoDisableZeroBalance: userOptions?.autoDisableZeroBalance ?? false,
                        mixGenerators: userOptions?.mixGenerators ?? false,
                    },
                    addressDumps: generateAddressDumps(enabledAddressList.id, addresses),
                }

                this._publish(startMessage)
                this._activeListIds.add(enabledAddressList.id)
            }

            // Reset retry states
            this._syncRetryCount = 0
            this._hasSyncAlertBeenSent = false

            this._pollTimeout = setTimeout(() => this._sync(), this._dynamicConfig.workersManagerPollIntervalMs)
            this._isSyncing = false
        } catch (error) {
            this._syncRetryCount++

            const maxRetries =
                this._dynamicConfig?.maxWorkersManagerSyncRetries ?? DYNAMIC_CONFIG.maxWorkersManagerSyncRetries

            this._logger.error(`An error occurred while fetching data during sync (attempt ${this._syncRetryCount})`, {
                data: error,
            })

            if (this._syncRetryCount >= maxRetries && !this._hasSyncAlertBeenSent) {
                try {
                    await sendWorkersManagerSyncFailureAlert(this._syncRetryCount, error)
                    this._hasSyncAlertBeenSent = true
                } catch (error) {
                    this._logger.error("Failed to send sync failure alert", { data: error })
                }
            }

            const retryDelay = getWorkersManagerRetryDelay(this._dynamicConfig, this._syncRetryCount)
            this._logger.info(`Retrying sync in ${retryDelay.toLocaleString("en-US")}ms...`)

            this._isSyncing = false
            this._clearTimeout()
            this._pollTimeout = setTimeout(() => this._sync(), retryDelay)
        }
    }

    /**
     * Starting procedure for the workers orchestrator.
     */
    async start(): Promise<void> {
        this._logger.info("Starting workers orchestrator...")
        await this._connectRabbitMQ()
        await this._sync()
    }

    /**
     * Stops the workers orchestrator and publishes a stop message for all active workers.
     */
    stop(): void {
        this._clearTimeout()

        for (const addressListId of this._activeListIds) {
            this._publish({
                type: WORKER_MESSAGE_TYPE.Stop,
                addressListId,
            })
        }

        this._connection?.close().catch(() => null)
    }
}

// Using a global variable to keep the same class instance in development (hot-reload)
const globalWorkersOrchestrator = global as unknown as { workersOrchestrator: WorkersOrchestrator | undefined }

/**
 * The workers orchestrator instance, either from the global variable or a new instance.
 */
export const workersOrchestrator = globalWorkersOrchestrator.workersOrchestrator ?? new WorkersOrchestrator()

// Writing back to the global variable
if (PUBLIC_ENV.nodeEnv !== "production") globalWorkersOrchestrator.workersOrchestrator = workersOrchestrator
