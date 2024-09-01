import { ErrorObj } from "#lib/constants/errors"
import { inject } from "@adonisjs/core"
import { HttpContext } from "@adonisjs/core/http"

@inject()
export default class BaseController {
    constructor(protected ctx: HttpContext) {}

    /**
     * Returns a properly formatted success response.
     * @param data Data to be sent in the response (optional).
     * @param meta Metadata to be sent in the response (optional, used for pagination).
     */
    async successResponse(data?: any, meta?: any) {
        let response: any = {
            success: true,
            data: data || null,
        }

        // Include meta (on top) only if it exists
        if (meta) {
            response = {
                success: true,
                meta: meta,
                data: data || null,
            }
        }

        this.ctx.response.send(response)
    }

    /**
     * Returns a properly formatted error response.
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
        const orderDirection = queries.orderDirection ? queries.orderDirection : "desc"

        return { page, limit, orderBy, orderDirection }
    }
}
