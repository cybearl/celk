/**
 * Note: All changes to the protocol should be reflected on the C++ side of the Celk protocol.
 */

/**
 * The subset of user options passed to each worker via the start message.
 */
export type WorkerUserOptions = {
    autoDisableZeroBalance: boolean
    mixGenerators: boolean
}
