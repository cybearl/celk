import { inject } from "@adonisjs/core"
import { HttpContext } from "@adonisjs/core/http"
import { ErrorObj, ErrorObjAdditionalData, FailedRequest } from "@cybearl/cypack"

@inject()
export default class BaseController {
    constructor(protected ctx: HttpContext) {}

    /**
     * A private function to check data validity.
     */
    private _checkDataValidity(data: any) {
        if (data === undefined || data === null) {
            return false
        }

        return true
    }

    /**
     * Returns a properly formatted success response.
     * @param data Data to be sent in the response (optional).
     * @param meta Metadata to be sent in the response (optional, used for pagination).
     */
    async successResponse(data?: any, meta?: any) {
        let response: any = {
            success: true,
            data: this._checkDataValidity(data) ? data : null,
        }

        // Include meta (on top) only if it exists
        if (meta) {
            response = {
                success: true,
                meta: meta,
                data: this._checkDataValidity(data) ? data : null,
            }
        }

        this.ctx.response.send(response)
    }

    /**
     * Returns a properly formatted error response, based on error code constants and
     * default Alias Studio API response format.
     * @param error Error code constant to be sent in the response.
     * @param data Additional data to be sent in the response (optional).
     * @param message Error message to be sent in the response (optional, defaults to the internal error message).
     */
    async errorResponse(error: ErrorObj, data: ErrorObjAdditionalData | null = null, message?: string) {
        const response: FailedRequest = {
            success: false,
            message: message ?? error.message,
            error: this._checkDataValidity(data) ? { ...error, data } : error,
        }

        this.ctx.response.status(error.status).send(response)

        return null
    }

    /**
     * Get the query options or their default values that can be applied to the indexation methods.
     * @param queries The request queries record.
     * @returns The options object (pagination & sorting).
     */
    getQueryOptions(queries: Record<string, any>) {
        const page = queries.page ? Number(queries.page) : 1
        const limit = queries.limit ? Number(queries.limit) : 10
        const orderBy = queries.orderBy ? queries.orderBy : "created_at"
        const direction = queries.direction ? queries.direction : "desc"

        return { page, limit, orderBy, direction }
    }
}
