import { stringifyWithBigIntSupport } from "@app/workers/lib/json"

/**
 * A set of colored Next.js status indicators for console messages.
 */
export const loggerIndicators = {
    success: "\x1b[32m ✓ \x1b[0m",
    warning: "\x1b[35m ⚠ \x1b[0m",
    error: "\x1b[31m ✗ \x1b[0m",
    info: "\x1b[33m ○ \x1b[0m",
    debug: "\x1b[34m ▷ \x1b[0m",
}

/**
 * The type for the options of a logger function.
 */
export type LoggerOptions = {
    /** Overrides the logger's default prefix for this call. */
    prefix?: string
    /** Additional data to log alongside the message (e.g. an Error object). */
    data?: unknown
}

/**
 * The type of a logger instance returned by `createLogger` or `withPrefix`.
 */
export type LoggerInstance = {
    success: (message: string, options?: LoggerOptions) => void
    warn: (message: string, options?: LoggerOptions) => void
    error: (message: string, options?: LoggerOptions) => void
    info: (message: string, options?: LoggerOptions) => void
    debug: (message: string, options?: LoggerOptions) => void
    /** Returns a new logger instance with a fixed default prefix. */
    withPrefix: (prefix: string) => LoggerInstance
}

/**
 * Creates a logger instance with an optional default prefix, indicators are
 * automatically hidden in browser environments (no ANSI support).
 * @param defaultPrefix An optional prefix prepended to all messages as `[prefix]`.
 */
function createLogger(defaultPrefix?: string): LoggerInstance {
    /**
     * Emits a log message with the specified indicator and options.
     * @param indicator The log indicator (e.g. success, error).
     * @param fn The logging function to call (e.g. console.log).
     * @param message The log message.
     * @param options Additional logging options.
     */
    function emit(indicator: string, fn: (...args: unknown[]) => void, message: string, options?: LoggerOptions) {
        const isClient = typeof window !== "undefined"

        const prefix = options?.prefix ?? defaultPrefix
        const formatted = `${isClient ? "" : indicator}${prefix ? `[${prefix}] ` : ""}${message}`

        if (options?.data === undefined) {
            fn(formatted)
        } else {
            // Aligning each new line with the message (server-side only)
            const dataString = stringifyWithBigIntSupport(options.data, 2)
                .split("\n")
                .map(line => (isClient ? line : `   ${line}`))
                .join("\n")

            fn(`${formatted}:`, `\n${dataString}`)
        }
    }

    return {
        success: (message, options) => emit(loggerIndicators.success, console.log, message, options),
        warn: (message, options) => emit(loggerIndicators.warning, console.warn, message, options),
        error: (message, options) => emit(loggerIndicators.error, console.error, message, options),
        info: (message, options) => emit(loggerIndicators.info, console.log, message, options),
        debug: (message, options) => emit(loggerIndicators.debug, console.debug, message, options),
        withPrefix: prefix => createLogger(prefix),
    }
}

/**
 * A thin logger for structured logging.
 */
export const logger = createLogger()
