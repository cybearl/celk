import User from "#models/user"
import { AuthorizerResponse } from "@adonisjs/bouncer/types"
import { hasRole } from "#lib/utils/roles"
import { BasePolicy } from "@adonisjs/bouncer"
import { AccessToken } from "@adonisjs/auth/access_tokens"
import { userTokenHasAbility } from "#lib/utils/tokens"
import { TokenAbility } from "#lib/constants/enums"

export default class TokenPolicy extends BasePolicy {
    async before(user: User | null) {
        if (user) return hasRole(user, "admin")
    }

    index(user: User, userToGetTokensFrom: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.TOKEN_READ) && user.id === userToGetTokensFrom.id
    }

    // Route reserved for <before()> authorization only
    indexAll(_user: User): AuthorizerResponse {
        return false
    }

    store(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.TOKEN_CREATE)
    }

    show(user: User, token: AccessToken): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.TOKEN_READ) && user.id === token.tokenableId
    }

    update(user: User, token: AccessToken): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.TOKEN_UPDATE) && user.id === token.tokenableId
    }

    destroy(user: User, token: AccessToken): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.TOKEN_DELETE) && user.id === token.tokenableId
    }
}
