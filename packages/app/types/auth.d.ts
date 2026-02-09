import type { UserSelectModel } from "@app/db/schema/user"

/**
 * The basic type for a session inside BetterAuth.
 */
export type BetterAuthSession = {
    id: string
    createdAt: Date
    updatedAt: Date
    userId: string
    expiresAt: Date
    token: string
    ipAddress?: string | null | undefined
    userAgent?: string | null | undefined
}

/**
 * The type for the custom session object returned by the BetterAuth
 * `customSession` callback.
 */
export type BetterAuthExtendedUserSession = AuthenticatedUser & {
    isAdmin: boolean | undefined
    session: BetterAuthSession
}

export type SignUpResponse = {
    token: string | null
    user: UserSelectModel
}
