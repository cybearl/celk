import errorCodes from "#lib/constants/errors"
import Role from "#models/role"
import User from "#models/user"
import type { HttpContext } from "@adonisjs/core/http"
import logger from "@adonisjs/core/services/logger"
import type { NextFn } from "@adonisjs/core/types/http"

/**
 * The role middleware is used to check if the user has the required role to access
 * a specific route.
 *
 * **Note:** Must be used after the `auth` middleware.
 * @param role The role required to access the route (optional, defaults to `admin`).
 */
export default class RoleMiddleware {
    async handle(
        ctx: HttpContext,
        next: NextFn,
        options: {
            role: Role["name"]
        } = { role: "admin" }
    ) {
        if (!ctx.auth.isAuthenticated) {
            return ctx.response.forbidden({
                success: false,
                message: "You must be authenticated to access this route.",
                error: errorCodes.UNAUTHORIZED,
            })
        }

        if (!ctx.auth.user || (ctx.auth.user && ctx.auth.user.isLocked === true)) {
            logger.warn(
                `user ${ctx.auth.user?.id} (${ctx.auth.user?.email}) tried to interact with the API but their account is locked`
            )

            return ctx.response.forbidden({
                success: false,
                message: errorCodes.LOCKED.message,
                error: errorCodes.LOCKED,
            })
        }

        const user = await User.find(ctx.auth.user.id)
        const userRoles = await user?.related("roles").query()
        const userHasRole = userRoles?.some((role) => role.name === options.role)

        if (!userHasRole) {
            return ctx.response.forbidden({
                success: false,
                message: "You do not have the required role to access this route.",
                error: errorCodes.UNAUTHORIZED,
            })
        }

        return next()
    }
}
