import type { HttpContext } from "@adonisjs/core/http"
import type { NextFn } from "@adonisjs/core/types/http"
import type { Authenticators } from "@adonisjs/auth/types"
import { AppErrors } from "#lib/constants/errors"
import { REDIRECT_TO } from "#lib/constants/database"
import logger from "@adonisjs/core/services/logger"

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users, also ensuring that the user logging in
 * is not locked.
 */
export default class AuthMiddleware {
    async handle(
        ctx: HttpContext,
        next: NextFn,
        options: {
            guards?: (keyof Authenticators)[]
        } = {}
    ) {
        try {
            await ctx.auth.authenticateUsing(options.guards, { loginRoute: REDIRECT_TO })
        } catch (error) {
            return ctx.response.unauthorized({
                success: false,
                message: "The token that was provided is invalid or has expired.",
                error: AppErrors.INVALID_TOKEN,
            })
        }

        if (!ctx.auth.user) {
            return ctx.response.unauthorized({
                success: false,
                message: AppErrors.UNAUTHENTICATED.message,
                error: AppErrors.UNAUTHENTICATED,
            })
        }

        if (ctx.auth.user && ctx.auth.user.isLocked === true) {
            logger.warn(
                `user ${ctx.auth.user.id} (${ctx.auth.user.email}) tried to interact with the API but their account is locked`
            )

            return ctx.response.forbidden({
                success: false,
                message: AppErrors.LOCKED.message,
                error: AppErrors.LOCKED,
            })
        }

        return next()
    }
}
