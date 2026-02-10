import { PUBLIC_ENV } from "@app/config/env"
import schema from "@app/db/schema"
import type { SessionSelectModel } from "@app/db/schema/session"
import type { UserSelectModel } from "@app/db/schema/user"
import { db } from "@app/lib/connectors/db"
import { CyCONSTANTS } from "@cybearl/cypack"
import { type BetterAuthOptions, betterAuth, type InferSession, type InferUser } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { customSession, username } from "better-auth/plugins"

/**
 * Options for Better Auth with type inference,
 * as shown [here](https://www.better-auth.com/docs/concepts/session-management#caveats-on-customizing-session-response).
 */
export const authOptions = {
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

    // Augmented user model
    user: {
        // Custom field names
        fields: {
            emailVerified: "is_email_verified",
            image: "image_url",
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
} satisfies BetterAuthOptions

/**
 * Maps the original badly named Better Auth properties to standard-following
 * user & session models:
 * - `emailVerified` => `isEmailVerified`.
 * - `image` => `imageUrl`.
 * @param session The original session object from Better Auth.
 * @param user The original user object from Better Auth.
 */
function getCustomSession({
    session,
    user,
}: {
    session: InferSession<typeof authOptions>
    user: InferUser<typeof authOptions>
}) {
    const customUser: UserSelectModel = {}
    const customSession: SessionSelectModel = {}
}

/**
 * The Better Auth configuration.
 */
const auth = betterAuth({
    ...authOptions,
    plugins: [...(authOptions.plugins ?? []), customSession(getCustomSession, authOptions)],
})

export default auth
export type AuthOptions = typeof authOptions
export type Auth = typeof auth
