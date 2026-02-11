import type { SessionSelectModel } from "@app/db/schema/session"
import type { UserSelectModel } from "@app/db/schema/user"
import type { AuthOptions } from "@app/lib/auth"
import type { Session } from "@app/types/auth"
import type { InferSession, InferUser } from "better-auth"

/**
 * Maps the original badly named Better Auth properties to a standard-following
 * user model.
 * @param user The original user object from Better Auth.
 * @returns The mapped user object for the database.
 */
export function mapBetterAuthUserToDbUser(user: InferUser<AuthOptions>): UserSelectModel {
    return {
        id: user.id,
        username: user.username!,
        displayUsername: user.displayUsername!,
        name: user.name,
        email: user.email,
        isEmailVerified: user.emailVerified,
        imageUrl: user.image ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

/**
 * Maps the original badly named Better Auth properties to standard-following
 * user & session models:
 * - `emailVerified` => `isEmailVerified`.
 * - `image` => `imageUrl`.
 * @param session The original session object from Better Auth.
 * @param user The original user object from Better Auth.
 */
// biome-ignore lint/suspicious/useAwait: Required for type inference in Better Auth's custom session plugin
export async function mapBetterAuthSessionToDbSession({
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
        user: mapBetterAuthUserToDbUser(user),
    }
}
