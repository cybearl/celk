import BaseController from "#controllers/templates/base_controller"
import { AppErrors } from "#lib/constants/errors"
import User from "#models/user"
import { credentialsValidator } from "#validators/auth_validator"
import { HttpContext } from "@adonisjs/core/http"
import logger from "@adonisjs/core/services/logger"

export default class AuthController extends BaseController {
    /**
     * Main user sign-in route (issue a token that will be stored inside the user's session storage or
     * used as a bearer token for the API access).
     */
    async signIn({ request }: HttpContext) {
        const { email, username, password } = await request.validateUsing(credentialsValidator)

        let user: User | null
        if (email) user = await User.verifyCredentials(email, password)
        else if (username) user = await User.verifyCredentials(username as string, password)
        // } else {
        //     return this.errorResponse(
        //         AppErrors.UNAUTHORIZED,
        //         null,
        //         "You must provide either an email or a username to login."
        //     )
        // }

        if (user.isLocked) {
            logger.warn(`user ${user.id} (${user.email}) tried to log in but their account is locked`)
            return this.errorResponse(AppErrors.LOCKED)
        }

        const token = await User.accessTokens.create(user, undefined, {
            name: "Login token, issued via credentials",
        })

        logger.debug(`user ${user.id} (${user.email}) logged in successfully, issuing a new access token`)
        return this.successResponse(token)
    }

    /**
     * Get all users (only for administrators).
     */
    async index() {
        const users = await User.all()
        return this.successResponse(users)
    }
}
