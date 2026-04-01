import type { ADDRESS_NETWORK, ADDRESS_PRIVATE_KEY_GENERATOR, ADDRESS_TYPE } from "@app/db/schema/address"
import type { UserOptionsSelectModel } from "@app/db/schema/userOptions"

/**
 * Note: All change to the protocol should be reflected in the worker's `protocol.hpp` file,
 * and any affiliated code that uses the protocol.
 */

/**
 * The subset of user options passed to each worker via the start message.
 */
export type WorkerUserOptions = Pick<UserOptionsSelectModel, "autoDisableZeroBalance">

/**
 * The available types of messages between the main process and the worker.
 */
export enum WORKER_MESSAGE_TYPE {
    // Manager -> worker
    Start = "start",
    HeartbeatAck = "heartbeat-ack",
    Stop = "stop",

    // Worker -> manager
    Heartbeat = "heartbeat",
    Report = "report",
    Match = "match",
    Error = "error",
}

/**
 * The base type for all messages sent between the main process and the worker.
 */
export type WorkerMessage = {
    type: WORKER_MESSAGE_TYPE
    addressListId: string
}

/**
 * The type for a start message sent from the main process to the worker.
 */
export type StartWorkerMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Start
    reportIntervalMs: number
    heartbeatIntervalMs: number
    heartbeatTimeoutMs: number
    stopOnFirstMatch: boolean
    userOptions: WorkerUserOptions
    addressesDumpFilePath: string
}

/**
 * The type for a heartbeat acknowledgement sent from the main process to the worker,
 * the worker kills itself if it does not receive this within `heartbeatTimeoutMs`.
 */
export type HeartbeatAckWorkerMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.HeartbeatAck
}

/**
 * The type for a stop message sent from the main process to the worker.
 */
export type StopWorkerMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Stop
}

/**
 * The type for a heartbeat message sent from the worker to the main process.
 */
export type WorkerHeartbeatMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Heartbeat
}

/**
 * The type for closest matches attached to addresses inside a report message
 * sent from the worker to the main process.
 */
export type AddressClosestMatches = { [addressId: string]: number[] }

/**
 * The type for a report message sent from the worker to the main process,
 * with the number of attempts being from the last report message sent.
 */
export type WorkerReportMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Report
    attempts: string
    closestMatches: AddressClosestMatches
}

/**
 * The type for a match message sent from the worker to the main process.
 */
export type WorkerMatchMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Match
    address: string
    privateKey: string
    totalAttempts: string
    stopOnFirstMatch: boolean
}

/**
 * The type for an error message sent from the worker to the main process.
 */
export type WorkerErrorMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Error
    message: string
}

/**
 * A discriminated union of all message types the manager can receive from a worker.
 */
export type AnyIncomingWorkerMessage =
    | WorkerHeartbeatMessage
    | WorkerReportMessage
    | WorkerMatchMessage
    | WorkerErrorMessage

/**
 * The format of the metadata file for an address list dump.
 */
export type AddressListDumpMetadata = {
    id: string
    version: number
}

/**
 * The way that addresses are represented inside the JSON dump files.
 */
export type AddressDump = {
    id: string
    name: string
    network: ADDRESS_NETWORK
    type: ADDRESS_TYPE
    value: string
    preEncoding: string | null
    privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR
    privateKeyRangeStart: string | null
    privateKeyRangeEnd: string | null
    addressListId: string
}

/**
 * A local representation of a match found by the worker (local save).
 *
 * Note: Not synced with the worker's `protocol.hpp` file, as it's only used for
 * local saves and not for communication between the worker and the main process.
 */
export type AddressMatch = {
    addressListId: string
    address: string
    encryptedPrivateKey: string
    totalAttempts: string
    matchedAt: string // ISO timestamp
}
