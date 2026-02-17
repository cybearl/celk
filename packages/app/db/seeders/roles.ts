import scRoles from "@app/db/schema/role"
import { db } from "@app/lib/server/connectors/db"

/**
 * An enum containing the slugs of the initially seeded user roles,
 * for easy reference throughout the application.
 */
export enum SeededUserRoleSlugs {
    ADMIN = "admin",
    USER = "user",
}

/**
 * Seed the roles into the database.
 */
export default async function seedRoles() {
    await db
        .insert(scRoles)
        .values([
            { name: "Admin", slug: "admin", description: "An administrator of the platform" },
            { name: "User", slug: "user", description: "A regular user of the platform" },
        ])
        .onConflictDoNothing()
}
