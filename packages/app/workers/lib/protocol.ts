import type { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"

/**
 * Note: All change to the protocol should be reflected in the worker's `protocol.hpp` file,
 * and any affiliated code that uses the protocol.
 */

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
 * The type for a report message sent from the worker to the main process,
 * with the number of attempts being from the last report message sent.
 */
export type WorkerReportMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Report
    attempts: bigint
}

/**
 * The type for a match message sent from the worker to the main process.
 */
export type WorkerMatchMessage = WorkerMessage & {
    type: WORKER_MESSAGE_TYPE.Match
    address: string
    privateKey: string
    attempts: bigint
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
    privateKeyRangeStart: bigint | null
    privateKeyRangeEnd: bigint | null
    isDisabled: boolean
    addressListId: string
}

/**
 * A local representation of a match found by the worker (local save).
 */
export type AddressMatch = {
    addressListId: string
    address: string
    encryptedPrivateKey: string
    attempts: bigint
    matchedAt: string // ISO timestamp
}
