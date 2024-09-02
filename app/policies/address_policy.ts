import { TokenAbility } from "#lib/constants/enums"
import { hasRole } from "#lib/utils/roles"
import { userTokenHasAbility } from "#lib/utils/tokens"
import Address from "#models/address"
import User from "#models/user"
import { BasePolicy } from "@adonisjs/bouncer"
import { AuthorizerResponse } from "@adonisjs/bouncer/types"

export default class AddressPolicy extends BasePolicy {
    async before(user: User | null) {
        if (user) return hasRole(user, "admin")
    }

    index(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ADDRESS_READ)
    }

    // Route reserved for <before()> authorization only
    indexAll(_user: User): AuthorizerResponse {
        return false
    }

    store(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ADDRESS_CREATE)
    }

    show(user: User, address: Address): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ADDRESS_READ) && user.id === address.userId
    }

    update(user: User, address: Address): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ADDRESS_UPDATE) && user.id === address.userId
    }

    destroy(user: User, address: Address): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ADDRESS_DELETE) && user.id === address.userId
    }

    lock(user: User, address: Address): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ADDRESS_LOCK) && user.id === address.userId
    }

    unlock(user: User, address: Address): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.ADDRESS_UNLOCK) && user.id === address.userId
    }
}
