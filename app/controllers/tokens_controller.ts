import BaseController from "#controllers/templates/base_controller"
import { TokenScope } from "#lib/utils/enums"
import { AppErrors } from "#lib/utils/errors"
import { userLog } from "#lib/utils/logger"
import { TokenScopeAbilities, recoverTokenScope } from "#lib/utils/tokens"
import User from "#models/user"
import TokenPolicy from "#policies/token_policy"
import { AccessToken } from "@adonisjs/auth/access_tokens"
import { HttpContext } from "@adonisjs/core/http"
import logger from "@adonisjs/core/services/logger"

export default class TokensController extends BaseController {
    /**
     * Get all tokens.
     */
    async index({ auth, bouncer, params }: HttpContext) {
        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        if (await bouncer.with(TokenPolicy).denies("index", user)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const tokens = await User.tokens.all(user)
        return this.successResponse(tokens)
    }

    /**
     * Get all tokens.
     *
     * Note: This route is only accessible by admins to get ALL data.
     */
    async adminIndex({ bouncer }: HttpContext) {
        if (await bouncer.with(TokenPolicy).denies("adminIndex")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const users = await User.all()
        const tokens: AccessToken[] = []

        for (const user of users) {
            const userTokens = await User.tokens.all(user)
            tokens.push(...userTokens)
        }

        return this.successResponse(
            tokens.map((token) => ({
                id: token.identifier,
                name: token.name,
                user_id: token.tokenableId,
                abilities: token.abilities,
                createdAt: token.createdAt,
                updatedAt: token.updatedAt,
                lastUsedAt: token.lastUsedAt,
                expiresAt: token.expiresAt,
            }))
        )
    }

    /**
     * Issue a new token.
     */
    async store({ auth, bouncer, request, params }: HttpContext) {
        const { scope } = request.body() as { scope: TokenScope | undefined }

        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        if (await bouncer.with(TokenPolicy).denies("store", user)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        // Validate the scope
        if (scope && !Object.values(TokenScope).includes(scope))
            return this.errorResponse(AppErrors.INVALID_TOKEN_SCOPE)

        // Fallback to unrestricted scope in case no specific scope was provided
        const token = await User.tokens.create(user, TokenScopeAbilities[scope ?? TokenScope.UNRESTRICTED], {
            name:
                user.id === auth.user?.id
                    ? `Token issued manually (${scope}).`
                    : `Token issued by an administrator (${scope}).`,
        })

        logger.debug(
            userLog(
                user,
                user.id === auth.user?.id
                    ? `issued themselves a new token with the scope '${scope}'.`
                    : `issued a new token with the scope '${scope}' for the user ${user.id}.`
            )
        )

        return this.successResponse(token)
    }

    /**
     * Get token by ID.
     */
    async show({ auth, bouncer, params }: HttpContext) {
        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        const token = await User.tokens.find(user, params.token_id)
        if (!token) return this.errorResponse(AppErrors.USER_NOT_FOUND)

        if (await bouncer.with(TokenPolicy).denies("show", token)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        return this.successResponse(token)
    }

    /**
     * Update (refresh) token by ID.
     */
    async update({ auth, bouncer, params }: HttpContext) {
        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        const currentAccessToken = await User.tokens.find(user, params.token_id)
        if (!currentAccessToken) return this.errorResponse(AppErrors.TOKEN_NOT_FOUND)

        if (await bouncer.with(TokenPolicy).denies("update", currentAccessToken)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const scope = recoverTokenScope(currentAccessToken.abilities)

        await User.tokens.delete(user, params.token_id)
        const token = await User.tokens.create(user, currentAccessToken.abilities, {
            name:
                user.id === auth.user?.id
                    ? `Token issued manually (${scope} - refreshed).`
                    : `Token issued by an administrator (${scope} - refreshed).`,
        })

        logger.debug(
            userLog(
                user,
                user.id === auth.user?.id
                    ? `refreshed their token with the scope '${scope}'.`
                    : `refreshed a token with the scope '${scope}' for the user ${user.id}.`
            )
        )

        return this.successResponse(token)
    }

    /**
     * Delete token by ID.
     */
    async destroy({ auth, bouncer, params }: HttpContext) {
        let user: User | null = auth.user as User
        if (params.user_id) {
            user = await User.find(params.user_id)
            if (!user) return this.errorResponse(AppErrors.USER_NOT_FOUND)
        }

        const currentAccessToken = await User.tokens.find(user, params.token_id)
        if (!currentAccessToken) return this.errorResponse(AppErrors.TOKEN_NOT_FOUND)

        if (await bouncer.with(TokenPolicy).denies("destroy", currentAccessToken)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const scope = recoverTokenScope(currentAccessToken.abilities)

        await User.tokens.delete(user, params.token_id)

        logger.debug(
            userLog(
                user,
                user.id === currentAccessToken.tokenableId
                    ? `revoked their token with the scope '${scope}'.`
                    : `revoked a token with the scope '${scope}' for the user ${user.id}.`
            )
        )

        return this.successResponse()
    }
}
