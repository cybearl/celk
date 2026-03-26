import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process"
import WORKERS_CONFIG from "@app/config/workers"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import { type LoggerInstance, logger } from "@app/lib/base/utils/logger"
import { getAddressListDumpFilePath } from "@app/lib/server/instrumentations/workersManager/lib/dumps"
import { generateWorkerLoggerPrefix } from "@app/lib/server/instrumentations/workersManager/lib/formats"
import { saveMatchLocally } from "@app/lib/server/instrumentations/workersManager/lib/matches"
import {
    type AnyIncomingWorkerMessage,
    type HeartbeatAckWorkerMessage,
    type StartWorkerMessage,
    type StopWorkerMessage,
    WORKER_MESSAGE_TYPE,
    type WorkerMessage,
} from "@app/lib/server/instrumentations/workersManager/protocol"
import { sendMatchAlert } from "@app/lib/server/utils/emails"
import { encryptPrivateKey } from "@app/lib/server/utils/encryption"
import {
    dbDisableAddressList,
    dbGetAddressListWithUser,
    dbIncrementAttemptCounts,
    dbSaveWorkerMatchToDb,
} from "@app/lib/server/utils/queries"

/**
 * Sends a message to a worker process via its stdin.
 * Returns false if the worker is already dead or the write fails.
 * @param worker The child process representing the worker.
 * @param message The message to send to the worker.
 */
export function sendToWorker(worker: ChildProcessWithoutNullStreams, message: WorkerMessage): boolean {
    if (worker.killed || worker.exitCode !== null) return false

    try {
        // Stringify the message with no intent to prevent invalid fragmentation
        worker.stdin.write(`${JSON.stringify(message)}\n`)

        return true
    } catch {
        return false
    }
}

/**
 * Routes parsed messages received by a worker.
 * @param worker The child process representing the worker.
 * @param addressListId The ID of the address list being processed by the worker.
 * @param message The parsed message to route.
 * @param workerLogger The logger instance for the worker.
 */
function routeWorkerMessage(
    worker: ChildProcessWithoutNullStreams,
    addressListId: string,
    message: AnyIncomingWorkerMessage,
    workerLogger: LoggerInstance,
) {
    switch (message.type) {
        case WORKER_MESSAGE_TYPE.Heartbeat: {
            const ackMessage: HeartbeatAckWorkerMessage = {
                type: WORKER_MESSAGE_TYPE.HeartbeatAck,
                addressListId: addressListId,
            }

            sendToWorker(worker, ackMessage)
            workerLogger.debug(`Heartbeat received and acknowledged.`)

            break
        }
        case WORKER_MESSAGE_TYPE.Report:
            // Fire-and-forget increment of attempt counts
            dbIncrementAttemptCounts(message.attempts, message.addressListId).catch(error => {
                workerLogger.error(`Failed to increment attempt counts:`, { data: error })
            })

            break
        case WORKER_MESSAGE_TYPE.Match: {
            let encryptedPrivateKey: string

            try {
                encryptedPrivateKey = encryptPrivateKey(message.privateKey)
            } catch (error) {
                workerLogger.error(`Failed to encrypt private key:`, { data: error })
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
                workerLogger.error(`Failed to save match locally:`, { data: error })
                // Continuing as local failure must not block DB/email
            }

            // DB persistence
            dbSaveWorkerMatchToDb(message.addressListId, message.address, encryptedPrivateKey).catch(error => {
                workerLogger.error(`Failed to save match to DB:`, { data: error })
            })

            // Email alert
            dbGetAddressListWithUser(message.addressListId)
                .then(result => {
                    if (!result) {
                        workerLogger.error(`Address list not found for match alert, skipping email.`)
                        return
                    }

                    sendMatchAlert({
                        user: result.user,
                        addressListName: result.addressList.name,
                        address: message.address,
                        totalAttempts: message.totalAttempts,
                    }).catch(error => {
                        workerLogger.error(`Failed to send match alert email:`, { data: error })
                    })
                })
                .catch(error => {
                    workerLogger.error(`Failed to fetch address list owner for match alert:`, { data: error })
                })

            // If "stop of first match" is set, disable the address list in the DB, assuming
            // that the manager will pull the address list afterwards, see it as disabled and
            // run the procedure to stop the worker and remove the dump file
            if (message.stopOnFirstMatch) {
                dbDisableAddressList(message.addressListId).catch(error => {
                    workerLogger.error(`Failed to disable address list (via stop on first match):`, { data: error })
                })
            }

            break
        }
        case WORKER_MESSAGE_TYPE.Error:
            workerLogger.error(`Error: ${message.message}`)

            break
        default: {
            workerLogger.error(`Unknown message type: ${(message as WorkerMessage).type}`)
        }
    }
}

/**
 * Listens to responses coming back from a worker, parses them, and routes
 * them to the appropriate handlers.
 * @param worker The child process representing the worker.
 * @param addressListId The ID of the address list being processed by the worker.
 * @param workerLogger The logger instance for the worker.
 */
export function listenToWorker(
    worker: ChildProcessWithoutNullStreams,
    addressListId: string,
    workerLogger: LoggerInstance,
) {
    let stdoutBuffer = ""

    worker.stdout.on("data", (chunk: Buffer) => {
        stdoutBuffer += chunk.toString()

        const lines = stdoutBuffer.split("\n")
        stdoutBuffer = lines.pop() ?? ""

        for (const rawLine of lines) {
            const line = rawLine.trim()
            if (line === "") continue

            try {
                const message = JSON.parse(line) as AnyIncomingWorkerMessage

                workerLogger.debug(`New message received from '${generateWorkerLoggerPrefix(addressListId)}':`, {
                    data: message,
                })

                routeWorkerMessage(worker, addressListId, message, workerLogger)
            } catch (error) {
                workerLogger.error(`Failed to parse message:`, {
                    data: {
                        line,
                        error,
                    },
                })
            }
        }
    })

    // Flush any remaining partial line in the buffer when the stream ends
    worker.stdout.on("end", () => {
        if (stdoutBuffer.trim() === "") return

        try {
            const message = JSON.parse(stdoutBuffer) as AnyIncomingWorkerMessage
            routeWorkerMessage(worker, addressListId, message, workerLogger)
        } catch (error) {
            workerLogger.error(`Failed to parse final message:`, { data: error })
        }

        stdoutBuffer = ""
    })

    worker.stdout.on("error", error => {
        workerLogger.error(`Worker stdout error:`, { data: error })
    })
}

/**
 * Spawns a new worker process for the given address list.
 * @param addressList The address list to be processed by the worker.
 * @param reportIntervalMs The report interval of the worker in milliseconds, i.e. how often it sends progress updates.
 * @returns The spawned child process representing the worker.
 */
export function spawnWorker(addressList: AddressListSelectModel, reportIntervalMs: number) {
    const workerLogger = logger.withPrefix(generateWorkerLoggerPrefix(addressList.id))

    const worker = spawn(WORKERS_CONFIG.binaryPath, [], { stdio: ["pipe", "pipe", "pipe"] })
    workerLogger.success(
        `Spawned worker with PID '${worker.pid}' for address list '${addressList.name}' (${addressList.id}).`,
    )

    // Stream write errors like EPIPE are emitted asynchronously,
    // so we need to listen for the error event on the worker's stdin to prevent
    // uncaught exceptions when trying to write to a dead worker
    worker.stdin.on("error", error => {
        workerLogger.error(`Worker stdin error:`, { data: error })
    })

    worker.on("error", error => {
        workerLogger.error(`Worker error:`, { data: error })
    })

    const startMessage: StartWorkerMessage = {
        type: WORKER_MESSAGE_TYPE.Start,
        addressListId: addressList.id,
        reportIntervalMs: reportIntervalMs,
        heartbeatIntervalMs: WORKERS_CONFIG.heartbeat.intervalMs,
        heartbeatTimeoutMs: WORKERS_CONFIG.heartbeat.timeoutMs,
        stopOnFirstMatch: false,
        addressesDumpFilePath: getAddressListDumpFilePath(addressList.id),
    }

    sendToWorker(worker, startMessage)
    listenToWorker(worker, addressList.id, workerLogger)

    worker.stderr.on("data", (chunk: Buffer) => {
        workerLogger.error(chunk.toString().trimEnd())
    })

    worker.on("exit", (code, signal) => {
        if (code === 0) workerLogger.success(`Worker exited successfully.`)
        else workerLogger.error(`Worker exited with '${code ?? signal}'.`)
    })

    worker.unref()

    return worker
}

/**
 * Asks a worker to stop gracefully, then force-kills it after `stopGraceMs` if it hasn't exited.
 * @param worker The child process representing the worker.
 * @param addressListId The ID of the address list being processed by the worker.
 */
export function stopWorker(worker: ChildProcessWithoutNullStreams, addressListId: string) {
    const workerLogger = logger.withPrefix(generateWorkerLoggerPrefix(addressListId))

    const stopMessage: StopWorkerMessage = {
        type: WORKER_MESSAGE_TYPE.Stop,
        addressListId: addressListId,
    }

    const hasBeenSent = sendToWorker(worker, stopMessage)
    if (!hasBeenSent) return

    const killTimeout = setTimeout(() => {
        if (!worker.killed) {
            workerLogger.error(`Did not exit within grace period, force killing.`)
            worker.kill("SIGKILL")
        }
    }, WORKERS_CONFIG.stopGraceMs)

    worker.once("exit", () => clearTimeout(killTimeout))
}
