import app from "@adonisjs/core/services/app"
import { HttpContext, ExceptionHandler } from "@adonisjs/core/http"
import { errors } from "@vinejs/vine"
import { ErrorObj, FailedRequest } from "@cybearl/cypack"

export default class HttpExceptionHandler extends ExceptionHandler {
    /**
     * In debug mode, the exception handler will display verbose errors
     * with pretty printed stack traces.
     */
    protected debug = !app.inProduction

    /**
     * The method is used for handling errors and returning
     * response to the client.
     */
    async handle(error: any, ctx: HttpContext) {
        // VineJS Validation Error
        if (error instanceof errors.E_VALIDATION_ERROR) {
            const errorCode: ErrorObj = {
                status: error.status || 500,
                name: error.code || "UNKNOWN_ERROR",
                message: error.message || "An unknown error occurred.",
                data: error.messages,
            }

            const response: FailedRequest = {
                success: false,
                message: errorCode.message,
                error: errorCode,
            }

            return ctx.response.status(errorCode.status).send(response)
        }

        return super.handle(error, ctx)
    }

    /**
     * The method is used to report error to the logging service or
     * the third party error monitoring service.
     *
     * @note You should not attempt to send a response from this method.
     */
    async report(error: unknown, ctx: HttpContext) {
        return super.report(error, ctx)
    }
}
