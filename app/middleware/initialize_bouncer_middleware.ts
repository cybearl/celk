import { Bouncer } from "@adonisjs/bouncer"
import type { HttpContext } from "@adonisjs/core/http"
import type { NextFn } from "@adonisjs/core/types/http"

/**
 * The registered policies.
 */
const policies = {
    //
}

/**
 * Init bouncer middleware is used to create a bouncer instance
 * during an HTTP request
 */
export default class InitializeBouncerMiddleware {
    async handle(ctx: HttpContext, next: NextFn) {
        /**
         * Create bouncer instance for the ongoing HTTP request.
         * We will pull the user from the HTTP context.
         */
        ctx.bouncer = new Bouncer(() => ctx.auth.user || null, undefined, policies).setContainerResolver(
            ctx.containerResolver
        )

        return next()
    }
}

declare module "@adonisjs/core/http" {
    export interface HttpContext {
        bouncer: Bouncer<Exclude<HttpContext["auth"]["user"], undefined>, undefined, typeof policies>
    }
}
