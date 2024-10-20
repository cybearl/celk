import type { TransformableInfo } from "logform"
import { createLogger, format, transports } from "winston"

/**
 * A simple printf function for Winston,
 * indenting new lines with the loggerIndent.
 * @param info The log info.
 * @returns The formatted log message.
 */
function printf(info: TransformableInfo) {
    // return `[${info.timestamp}] ${info.message}`.replace(
    //     /\n/g,
    //     `\n${" ".repeat(11)}`
    // );

    return info.message
}

/**
 * Logger format.
 */
const loggerFormat = format.combine(
    format.timestamp({ format: "HH:mm:ss" }),
    format.printf(printf),
    format.colorize({ all: true })
)

/**
 * Main Winston logger instance, used for logging when the AdonisJS logger
 * is not available or the application is not running in the AdonisJS context.
 */
const externalLogger = createLogger({
    format: loggerFormat,
    transports: [new transports.Console({ level: "silly" })],
})

export default externalLogger
