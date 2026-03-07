/**
 * The available types of messages between the main process and the worker.
 */
export enum WORKER_MESSAGE_TYPE {
    Start = "start",
    Stop = "stop",
    Progress = "progress",
    Match = "match",
    Error = "error",
}

/**
 * The type for a start message sent from the main process to the worker.
 */
export type StartWorkerMessage = {
    type: WORKER_MESSAGE_TYPE.Start
    listId: string
    reportIntervalMs: number
    stopOnFirstMatch: boolean
    addresses: Array<{ type: string; value: string }>
}

/**
 * The type for a stop message sent from the main process to the worker.
 */
export type StopWorkerMessage = {
    type: WORKER_MESSAGE_TYPE.Stop
}

/**
 * The type for a progress message sent from the worker to the main process.
 */
export type WorkerProgressMessage = {
    type: WORKER_MESSAGE_TYPE.Progress
    attempts: bigint // Since last report
}

/**
 * The type for a match message sent from the worker to the main process.
 */
export type WorkerMatchMessage = {
    type: WORKER_MESSAGE_TYPE.Match
    address: string
    privateKey: string
    attempts: bigint
}

/**
 * The type for an error message sent from the worker to the main process.
 */
export type WorkerErrorMessage = {
    type: WORKER_MESSAGE_TYPE.Error
    message: string
}
