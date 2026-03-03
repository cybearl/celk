import type { SessionSelectModel } from "@app/db/schema/session"
import type { UserSelectModel } from "@app/db/schema/user"
import scUserRoles from "@app/db/schema/userRoles"
import { SEEDED_USER_ROLE_SLUGS } from "@app/db/seeders/roles"
import type { AuthOptions } from "@app/lib/auth"
import { db } from "@app/lib/server/connectors/db"
import type { Session } from "@app/types/auth"
import type { InferSession, InferUser } from "better-auth"
import { eq } from "drizzle-orm"

/**
 * Reconciles a Better Auth user object into the project's UserSelectModel,
 * mapping Better Auth's field names to the project's naming conventions.
 * @param user The Better Auth user object to normalize.
 * @returns The normalized user object conforming to UserSelectModel.
 */
export function normalizeUser(user: InferUser<AuthOptions>): UserSelectModel {
    return {
        id: user.id,
        username: user.username!,
        displayUsername: user.displayUsername!,
        name: user.name,
        email: user.email,
        isEmailVerified: user.emailVerified,
        isLocked: user.isLocked ?? false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

/**
 * Reconciles a Better Auth session and user into the project's Session type.
 * Passed directly to the customSession plugin as the session builder callback.
 * @param session The Better Auth session object to normalize.
 * @param user The Better Auth user object associated with the session.
 * @returns The normalized session object conforming to Session type.
 */
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

    const userRoles = await db.query.user_roles.findMany({
        where: eq(scUserRoles.userId, user.id),
        with: { role: true },
    })

    // Check if the user has the admin role
    const isAdmin = userRoles.some(userRole => userRole.role.slug === SEEDED_USER_ROLE_SLUGS.ADMIN)

    return {
        ...customSession,
        user: normalizeUser(user),
        roles: userRoles.map(r => r.role),
        isAdmin,
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
