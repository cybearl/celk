import { PUBLIC_ENV } from "@app/config/env"
import schema from "@app/db/schema"
import { normalizeSession, normalizeUsername } from "@app/lib/base/utils/auth"
import { db } from "@app/lib/server/connectors/db"
import { sendPasswordResetEmail, sendVerificationEmail } from "@app/lib/server/utils/emails"
import { CyCONSTANTS } from "@cybearl/cypack"
import { type BetterAuthOptions, betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { customSession, username } from "better-auth/plugins"

/**
 * Options for Better Auth with type inference,
 * as shown [here](https://www.better-auth.com/docs/concepts/session-management#caveats-on-customizing-session-response).
 */
export const authOptions = {
    appName: "celk",
    baseURL: PUBLIC_ENV.appUrl,

    // Auth methods
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        requireEmailVerification: true,
        minPasswordLength: CyCONSTANTS.MIN_PASSWORD_LENGTH,
        maxPasswordLength: CyCONSTANTS.MAX_PASSWORD_LENGTH,
        sendResetPassword: sendPasswordResetEmail,
    },

    emailVerification: {
        autoSignInAfterVerification: true,
        // beforeEmailVerification
        sendVerificationEmail: sendVerificationEmail,
        // afterEmailVerification
    },

    // Database access
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema,
    }),

    // Augmented user model
    user: {
        // Custom field names
        fields: {
            emailVerified: "isEmailVerified",
            image: "imageUrl",
        },
        // Additional fields unknown to Better Auth
        additionalFields: {
            isLocked: {
                type: "boolean",
                required: false, // Required in reality but only at DB level
                input: false,
            },
        },
    },

    // Hooks
    databaseHooks: {
        user: {
            create: {
                before: async user => ({
                    data: { ...user, isLocked: PUBLIC_ENV.lockNewUsers },
                }),
            },
        },
    },

    // Plugins
    plugins: [
        username({
            minUsernameLength: CyCONSTANTS.MIN_USERNAME_LENGTH,
            maxUsernameLength: CyCONSTANTS.MAX_USERNAME_LENGTH,
            usernameValidator: username => CyCONSTANTS.USERNAME_REGEX.test(username),
            displayUsernameNormalization: normalizeUsername,
        }),
    ],
} satisfies BetterAuthOptions

/**
 * The Better Auth configuration.
 */
const auth = betterAuth({
    ...authOptions,
    plugins: [...(authOptions.plugins ?? []), customSession(normalizeSession, authOptions)],
})

export default auth
export type AuthOptions = typeof authOptions
export type Auth = typeof auth
