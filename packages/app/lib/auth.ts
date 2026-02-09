import { PUBLIC_ENV } from "@app/config/env"
import schema from "@app/db/schema"
import { db } from "@app/lib/connectors/db"
import { CyCONSTANTS } from "@cybearl/cypack"
import { type BetterAuthOptions, betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { username } from "better-auth/plugins"

/**
 * Options for Better Auth with type inference,
 * as shown [here](https://www.better-auth.com/docs/concepts/session-management#caveats-on-customizing-session-response).
 */
export const betterAuthOptions = {
    appName: "nano-celk",
    baseURL: PUBLIC_ENV.appUrl,

    // Auth methods
    emailAndPassword: {
        enabled: true,
    },

    // Database access
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema,
    }),
    plugins: [
        username({
            minUsernameLength: CyCONSTANTS.MIN_USERNAME_LENGTH,
            maxUsernameLength: CyCONSTANTS.MAX_USERNAME_LENGTH,
            displayUsernameValidator: displayUsername => {
                return CyCONSTANTS.USERNAME_REGEX.test(displayUsername)
            },
        }),
    ],
} satisfies BetterAuthOptions

/**
 * The Better Auth configuration.
 */
const auth = betterAuth({
    ...betterAuthOptions,
    plugins: [...(betterAuthOptions.plugins ?? [])],
})

export default auth
export type Auth = typeof auth
