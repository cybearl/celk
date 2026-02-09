import { type Logger, pino } from "pino"

export const logger: Logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        },
    },
    level: process.env.LOG_LEVEL || "info",

    redact: [], // Prevent logging of sensitive data
})
