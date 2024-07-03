import { ErrorObj } from "#lib/constants/errors"
import { inject } from "@adonisjs/core"
import { HttpContext } from "@adonisjs/core/http"

@inject()
export default class BaseController {
    constructor(protected ctx: HttpContext) {}

    /**
     * Returns a properly formatted success response, based on error objects format.
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
     * Returns a properly formatted error response, based on error objects format.
     * @param errorObj Error object to be sent in the response.
     * @param data Additional data to be sent in the response (optional).
     * @param message Error message to be sent in the response (optional, defaults to the internal error message).
     */
    async errorResponse(errorObj: ErrorObj, data: any | null = null, message?: string) {
        const response: { success: boolean; message: string; error: ErrorObj } = {
            success: false,
            message: message || errorObj.message,
            error: data !== null ? { ...errorObj, data } : errorObj,
        }

        this.ctx.response.status(errorObj.status).send(response)
    }
}
