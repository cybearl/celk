import { defineConfig } from "@adonisjs/auth"
import { InferAuthEvents, Authenticators } from "@adonisjs/auth/types"
import { tokensGuard, tokensUserProvider } from "@adonisjs/auth/access_tokens"

/**
 * The configuration settings for the auth module,
 * either via basic auth or token-based auth.
 */
const authConfig = defineConfig({
    default: "token",
    guards: {
        token: tokensGuard({
            provider: tokensUserProvider({
                tokens: "accessTokens",
                model: () => import("#models/user"),
            }),
        }),
    },
})

export default authConfig

/**
 * Inferring types from the configured auth guards.
 */
declare module "@adonisjs/auth/types" {
    interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module "@adonisjs/core/types" {
    interface EventsList extends InferAuthEvents<Authenticators> {}
}
