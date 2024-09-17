import { TokenAbility } from "#lib/constants/enums"
import { hasRole } from "#lib/utils/roles"
import { userTokenHasAbility } from "#lib/utils/tokens"
import Job from "#models/job"
import User from "#models/user"
import { BasePolicy } from "@adonisjs/bouncer"
import { AuthorizerResponse } from "@adonisjs/bouncer/types"

export default class JobPolicy extends BasePolicy {
    async before(user: User | null) {
        if (user) return hasRole(user, "admin")
    }

    index(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.JOB_READ)
    }

    // Route reserved for <before()> authorization only
    indexAll(_user: User): AuthorizerResponse {
        return false
    }

    store(user: User): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.JOB_CREATE)
    }

    show(user: User, job: Job): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.JOB_READ) && user.id === job.userId
    }

    update(user: User, job: Job): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.JOB_UPDATE) && user.id === job.userId
    }

    destroy(user: User, job: Job): AuthorizerResponse {
        return userTokenHasAbility(user, TokenAbility.JOB_DELETE) && user.id === job.userId
    }
}
