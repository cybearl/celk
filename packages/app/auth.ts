import { PUBLIC_ENV } from "@app/config/env"
import schema from "@app/db/schema"
import { db } from "@app/lib/connectors/db"
import { CyCONSTANTS } from "@cybearl/cypack"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { username } from "better-auth/plugins"

/**
 * The Better Auth configuration.
 */
const auth = betterAuth({
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

    // User table with additional fields
    user: {
        additionalFields: {
            //test: {
            //    type: ["user", "admin"],
            //    required: false,
            //    defaultValue: "user",
            //    input: false,
            //},
        },
    },

    // Plugins
    plugins: [
        username({
            minUsernameLength: CyCONSTANTS.MIN_USERNAME_LENGTH,
            maxUsernameLength: CyCONSTANTS.MAX_USERNAME_LENGTH,
            displayUsernameValidator: displayUsername => {
                return CyCONSTANTS.USERNAME_REGEX.test(displayUsername)
            },
        }),
    ],
})

export default auth
export type Auth = typeof auth
