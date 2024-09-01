import BaseController from "#controllers/templates/base_controller"
import { AppErrors } from "#lib/constants/errors"
import { userLog } from "#lib/utils/logger"
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
        else user = await User.verifyCredentials(username as string, password)

        if (user.isLocked) {
            logger.info(userLog(user, "tried to sign in but their account is locked"))
            return this.errorResponse(AppErrors.LOCKED)
        }

        const token = await User.tokens.create(user, undefined, {
            name: "Login token, issued via credentials",
        })

        logger.debug(userLog(user, "signed in successfully, issuing a new token"))
        return this.successResponse(token)
    }
}
