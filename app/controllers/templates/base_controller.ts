import { ErrorCode } from "#lib/constants/errors"
import { inject } from "@adonisjs/core"
import { HttpContext } from "@adonisjs/core/http"

@inject()
export default class BaseController {
    constructor(protected ctx: HttpContext) {}

    /**
     * Returns a properly formatted success response, based on errors format.
     * @param data Data to be sent in the response (optional).
     */
    async successResponse(data?: any) {
        const response: { success: boolean; data: any } = {
            success: true,
            data: data || null,
        }

        this.ctx.response.send(response)
    }

    /**
     * Returns a properly formatted error response, based on errors format.
     * @param error Error constant to be sent in the response.
     * @param data Additional data to be sent in the response (optional).
     * @param message Error message to be sent in the response (optional, defaults to the internal error message).
     */
    async errorResponse(errorCode: ErrorCode, data: any | null = null, message?: string) {
        const response: { success: boolean; message: string; error: ErrorCode } = {
            success: false,
            message: message || errorCode.message,
            error: data !== null ? { ...errorCode, data } : errorCode,
        }

        this.ctx.response.status(errorCode.status).send(response)
    }
}
