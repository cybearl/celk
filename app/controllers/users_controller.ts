import BaseController from "#controllers/templates/base_controller"
import { AppErrors } from "#lib/utils/errors"
import { userLog } from "#lib/utils/logger"
import User from "#models/user"
import UserPolicy from "#policies/user_policy"
import { userUpdateValidator } from "#validators/user_validator"
import { HttpContext } from "@adonisjs/core/http"
import logger from "@adonisjs/core/services/logger"

export default class UsersController extends BaseController {
    /**
     * Get all users.
     *
     * Note: This route is only accessible by admins to get ALL data.
     */
    async adminIndex({ bouncer, request }: HttpContext) {
        if (await bouncer.with(UserPolicy).denies("adminIndex")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        const users = await User.query()
            .orderBy(options.orderBy, options.direction)
            .paginate(options.page, options.limit)

        const tmp = users.toJSON()
        return this.successResponse(tmp.data, tmp.meta)
    }

    /**
     * Get user by ID.
     */
    async show({ auth, bouncer, params }: HttpContext) {
        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        // Note: we will probably add a way to see other users with data restrictions,
        // That's why the 'show' method is here even if, for now, it restricts access
        // to current user only
        if (await bouncer.with(UserPolicy).denies("show", user)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        return this.successResponse(user)
    }

    /**
     * Update user by ID.
     */
    async update({ auth, bouncer, request, params }: HttpContext) {
        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        if (await bouncer.with(UserPolicy).denies("update", user)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const { email, username, password, description } = await request.validateUsing(userUpdateValidator)

        // Non-isolated
        // Both email and username are unique, so we need to check if the user already exists.
        if (email && (await User.findBy("email", email))) return this.errorResponse(AppErrors.EMAIL_ALREADY_EXISTS)
        if (username && (await User.findBy("username", username))) return this.errorResponse(AppErrors.USERNAME_ALREADY_EXISTS)

        user.email = email || user.email
        user.username = username || user.username
        user.password = password || user.password
        user.description = description || user.description
        await user.save()

        logger.debug(userLog(user, "updated successfully"))
        return this.successResponse(user)
    }

    /**
     * Delete user by ID.
     */
    async destroy({ auth, bouncer, params }: HttpContext) {
        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        if (await bouncer.with(UserPolicy).denies("destroy", user)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        await user.delete()

        logger.debug(userLog(user, "deleted successfully"))
        return this.successResponse(user)
    }

    /**
     * Lock a user, preventing the user from logging in and using the system.
     */
    async lock({ auth, bouncer, params }: HttpContext) {
        if (await bouncer.with(UserPolicy).denies("lock")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const user = await User.find(params.user_id)
        if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)

        // Prevent admins from locking themselves
        if (user.id === auth.user?.id) {
            return this.errorResponse(AppErrors.YOU_CANNOT_LOCK_YOURSELF)
        }

        user.isLocked = true
        await user.save()

        logger.info(userLog(user, "locked by administrator"))
        return this.successResponse(user)
    }

    /**
     * Unlock a user, allowing them to log in and use the system again.
     */
    async unlock({ auth, bouncer, params }: HttpContext) {
        if (await bouncer.with(UserPolicy).denies("unlock")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const user = await User.find(params.user_id)
        if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)

        // Prevent admins from unlocking themselves
        if (user.id === auth.user?.id) {
            return this.errorResponse(AppErrors.YOU_CANNOT_UNLOCK_YOURSELF)
        }

        user.isLocked = false
        await user.save()

        logger.info(userLog(user, "unlocked by administrator"))
        return this.successResponse(user)
    }
}
