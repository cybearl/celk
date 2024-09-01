import User from "#models/user"
import { AuthorizerResponse } from "@adonisjs/bouncer/types"
import { hasRole } from "#lib/utils/roles"
import { BasePolicy } from "@adonisjs/bouncer"
import { TokenAbility, userTokenHasAbility } from "#lib/utils/tokens"

export default class UserPolicy extends BasePolicy {
    async before(user: User | null) {
        if (user) return hasRole(user, "admin")
    }

    // Route reserved for <before()> authorization only
    indexAll(_user: User): AuthorizerResponse {
        return false
    }

    // Route reserved for <before()> authorization only
    store(_user: User): AuthorizerResponse {
        return false
    }

    show(user: User, fetchedUser: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.USER_READ) && user.id === fetchedUser.id
    }

    update(user: User, fetchedUser: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.USER_UPDATE) && user.id === fetchedUser.id
    }

    destroy(user: User, fetchedUser: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.USER_DELETE) && user.id === fetchedUser.id
    }

    // Route reserved for <before()> authorization only
    lock(_user: User): AuthorizerResponse {
        return false
    }

    // Route reserved for <before()> authorization only
    unlock(_user: User): AuthorizerResponse {
        return false
    }
}
