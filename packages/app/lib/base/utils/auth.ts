import type { SessionSelectModel } from "@app/db/schema/session"
import type { UserSelectModel } from "@app/db/schema/user"
import type { AuthOptions } from "@app/lib/auth"
import type { Session } from "@app/types/auth"
import type { InferSession, InferUser } from "better-auth"

/**
 * Reconciles a Better Auth user object into the project's UserSelectModel,
 * mapping Better Auth's field names to the project's naming conventions.
 */
export function normalizeUser(user: InferUser<AuthOptions>): UserSelectModel {
    return {
        id: user.id,
        username: user.username!,
        displayUsername: user.displayUsername!,
        name: user.name,
        email: user.email,
        isEmailVerified: user.emailVerified,
        isLocked: user.isLocked,
        imageUrl: user.image ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

/**
 * Reconciles a Better Auth session and user into the project's Session type.
 * Passed directly to the customSession plugin as the session builder callback.
 */
// biome-ignore lint/suspicious/useAwait: Required for type inference in Better Auth's custom session plugin
export async function normalizeSession({
    session,
    user,
}: {
    session: InferSession<AuthOptions>
    user: InferUser<AuthOptions>
}): Promise<Session> {
    const customSession: SessionSelectModel = {
        id: session.id,
        token: session.token,
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
        userId: session.userId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
    }

    return {
        ...customSession,
        user: normalizeUser(user),
    }
}

/**
 * Normalize a username into a display username:
 * - `username` => `Username`.
 * - `displayUsername` => `Display Username`.
 * - `user-name` => `User Name`.
 * - `user_name` => `User Name`.
 * - `user.name` => `User Name`.
 * @param username The original username to normalize.
 * @returns The normalized display username.
 */
export function normalizeUsername(username: string): string {
    return username.replace(/[-_.]/g, " ").replace(/\b\w/g, char => char.toUpperCase())
}
