import errorCodes from "#lib/constants/errors"
import Controller from "#lib/templates/controller"
import Role, { RoleNames } from "#models/role"
import User from "#models/user"
import { credentialsValidator, userRegistrationValidator, userUpdateValidator } from "#validators/auth_validator"
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
        return this.successResponse(token)
    }

    /**
     * Get all users (only for administrators).
     */
    async index() {
        const users = await User.all()
        return this.successResponse(users)
    }

    /**
     * Register a new user (only for administrators).
     */
    async store({ request }: HttpContext) {
        const { isLocked, email, username, password } = await request.validateUsing(userRegistrationValidator)

        const obj = {
            isLocked: isLocked !== undefined ? isLocked : false,
            email,
            username,
            password,
        }

        const user = await User.create(obj)

        const defaultRole = await Role.findBy("name", RoleNames.UserRole)
        if (defaultRole) await user.related("roles").attach([defaultRole.id])
        else this.errorResponse(errorCodes.ROLE_NOT_FOUND, null, "The default user role could not be found.")

        logger.debug(`user ${user.id} (${user.email}) registered successfully`)
        return this.successResponse(user)
    }

    /**
     * Get user by ID (only for administrators).
     */
    async show({ params }: HttpContext) {
        const user = await User.find(params.user_id)
        if (!user) return this.errorResponse(errorCodes.USER_NOT_FOUND, null, "This user does not exist.")

        return this.successResponse(user)
    }

    /**
     * Update user by ID (only for administrators).
     */
    async update({ request, params, auth }: HttpContext) {
        const user = await User.find(params.user_id)
        if (!user) return this.errorResponse(errorCodes.USER_NOT_FOUND, null, "This user does not exist.")

        const { isLocked, email, username, password } = await request.validateUsing(userUpdateValidator)

        // Prevent all users (even admins) from locking/unlocking themselves
        if (isLocked !== undefined && user.id !== auth.user?.id) {
            user.isLocked = isLocked
        }

        user.email = email || user.email
        user.username = username || user.username
        user.password = password || user.password
        await user.save()

        logger.debug(`user ${user.id} (${user.email}) updated successfully`)
        return this.successResponse(user)
    }

    /**
     * Delete user by ID (only for administrators).
     */
    async destroy({ params }: HttpContext) {
        const user = await User.find(params.user_id)
        if (!user) return this.errorResponse(errorCodes.USER_NOT_FOUND, null, "This user does not exist.")
        await user.delete()

        logger.debug(`user ${user.id} (${user.email}) deleted successfully`)
        return this.successResponse()
    }

    /**
     * Lock a user, preventing the user from logging in and using the system (only for administrators).
     */
    async lock({ params, auth }: HttpContext) {
        const user = await User.find(params.user_id)
        if (!user) return this.errorResponse(errorCodes.USER_NOT_FOUND, null, "This user does not exist.")

        // Prevent all users (even admins) from locking themselves
        if (user.id === auth.user?.id) {
            return this.errorResponse(errorCodes.YOU_CANNOT_LOCK_YOURSELF, null, "Stop trying to lock yourself!")
        }

        user.isLocked = true
        await user.save()

        logger.info(`user ${user.id} (${user.email}) locked by administrator`)

        return this.successResponse(user)
    }

    /**
     * Unlock a user, allowing them to log in and use the system again (only for administrators).
     */
    async unlock({ params, auth }: HttpContext) {
        const user = await User.find(params.user_id)
        if (!user) return this.errorResponse(errorCodes.USER_NOT_FOUND, null, "This user does not exist.")

        // Prevent all users (even admins) from unlocking themselves
        if (user.id === auth.user?.id) {
            return this.errorResponse(errorCodes.YOU_CANNOT_UNLOCK_YOURSELF, null, "Stop trying to unlock yourself!")
        }

        user.isLocked = false
        await user.save()

        logger.info(`user ${user.id} (${user.email}) unlocked by administrator`)

        return this.successResponse(user)
    }
}
