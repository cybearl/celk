import { hasRole } from "#lib/utils/roles"
import { TokenAbility, userTokenHasAbility } from "#lib/utils/tokens"
import User from "#models/user"
import { BasePolicy } from "@adonisjs/bouncer"
import { AuthorizerResponse } from "@adonisjs/bouncer/types"

export default class ChainPolicy extends BasePolicy {
    async before(user: User | null) {
        if (user) return hasRole(user, "admin")
    }

    index(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.CHAIN_READ)
    }

    // Route reserved for <before()> authorization only
    indexAll(_user: User): AuthorizerResponse {
        return false
    }

    // Route reserved for <before()> authorization only
    store(_user: User): AuthorizerResponse {
        return false
    }

    show(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.CHAIN_READ)
    }

    // Route reserved for <before()> authorization only
    update(_user: User): AuthorizerResponse {
        return false
    }

    // Route reserved for <before()> authorization only
    destroy(_user: User): AuthorizerResponse {
        return false
    }
}
