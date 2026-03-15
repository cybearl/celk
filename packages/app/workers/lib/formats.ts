/**
 * Generates the prefix for a worker's logger instance.
 * @param addressListId The ID of the address list attached to the worker.
 * @returns The generated logger prefix.
 */
export function generateWorkerLoggerPrefix(addressListId: string): string {
    return `W-${addressListId.slice(0, 8)}`
}
