import { type BetterAuthOptions, betterAuth } from "better-auth"

/**
 * Options for Better Auth with type inference,
 * as shown [here](https://www.better-auth.com/docs/concepts/session-management#caveats-on-customizing-session-response).
 */
const options = {
    appName: "nano-celk",
} satisfies BetterAuthOptions

/**
 * The Better Auth configuration.
 */
export const auth = betterAuth({
    ...options,
})
