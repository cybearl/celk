import User from "#models/user"
import { AuthorizerResponse } from "@adonisjs/bouncer/types"
import { hasRole } from "#lib/utils/roles"
import { BasePolicy } from "@adonisjs/bouncer"
import { TokenAbility, userTokenHasAbility } from "#lib/utils/tokens"
import Role from "#models/role"

export default class AbiPolicy extends BasePolicy {
    async before(user: User | null) {
        if (user) return hasRole(user, "admin")
    }

    index(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ROLE_READ)
    }

    // Route reserved for <before()> authorization only
    indexAll(_user: User): AuthorizerResponse {
        return false
    }

    // Route reserved for <before()> authorization only
    store(_user: User): AuthorizerResponse {
        return false
    }

    show(user: User, role: Role): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ROLE_READ) && hasRole(user, role.name)
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
