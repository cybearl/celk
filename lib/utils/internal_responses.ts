import { ErrorCode } from "#lib/constants/errors"
import logger from "@adonisjs/core/services/logger"

/**
 * Similar to the `errorResponse` method from the controllers, allows to log an error
 * with the same format but internally.
 * @param errorCode Error constant to be logged.
 * @param data Additional data to be sent in the response (optional).
 * @param message Error message to be sent in the response (optional, defaults to the internal error message).
 * @param isFatal Whether the error is fatal or not (defaults to true).
 */
export function internalError(errorCode: ErrorCode, data: any | null = null, message?: string, isFatal = true) {
    const response: { success: boolean; message: string; error: ErrorCode } = {
        success: false,
        message: message || errorCode.message,
        error: data !== null ? { ...errorCode, data } : errorCode,
    }

    if (isFatal) {
        logger.fatal(response)
    }

    logger.error(response)
}
