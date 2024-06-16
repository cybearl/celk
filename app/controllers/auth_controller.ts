import errorCodes from "#lib/constants/errors"
import Controller from "#lib/templates/controller"
import User from "#models/user"
import { credentialsValidator } from "#validators/auth_validator"
import { HttpContext } from "@adonisjs/core/http"
import logger from "@adonisjs/core/services/logger"

export default class AuthController extends Controller {
    /**
     * Issue an access token for a user, based on their credentials.
     * It is the initial route used by a user to issue their first token.
     */
    async login({ request }: HttpContext) {
        const { email, username, password } = await request.validateUsing(credentialsValidator)

        let user: User | null

        if (email) {
            user = await User.verifyCredentials(email, password)
        } else if (username) {
            user = await User.verifyCredentials(username as string, password)
        } else {
            return this.errorResponse(
                errorCodes.UNAUTHORIZED,
                null,
                "You must provide either an email or a username to login."
            )
        }

        if (user.isLocked) {
            logger.warn(`user ${user.id} (${user.email}) tried to log in but their account is locked`)
            return this.errorResponse(errorCodes.LOCKED)
        }

        const token = await User.accessTokens.create(user, undefined, {
            name: "Login token, issued via credentials",
        })

        logger.debug(`user ${user.id} (${user.email}) logged in successfully, issuing a new access token`)
        return this.successResponse({ token })
    }
}
