import scRoles from "@app/db/schema/role"
import scUserRoles from "@app/db/schema/userRoles"
import { db } from "@app/lib/server/connectors/db"
import { config } from "dotenv"
import { eq } from "drizzle-orm"

// Manually loading environment variables as
// this is outside of the Next.js runtime
config({ path: "../.env" })

/**
 * An enum containing the slugs of the initially seeded user roles,
 * for easy reference throughout the application.
 */
export enum SEEDED_USER_ROLE_SLUGS {
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
            { name: "Admin", slug: SEEDED_USER_ROLE_SLUGS.ADMIN, description: "An administrator of the platform" },
            { name: "User", slug: SEEDED_USER_ROLE_SLUGS.USER, description: "A regular user of the platform" },
        ])
        .onConflictDoNothing()

    if (!process.env.DEFAULT_ADMIN_USERNAME) {
        throw new Error("Admin role cannot be assigned to the default admin user because the username is not set.")
    }

    const defaultAdminUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, process.env.DEFAULT_ADMIN_USERNAME!),
    })

    if (!defaultAdminUser) {
        throw new Error(
            "Admin role cannot be assigned to the default admin user because the user was not found in the database.",
        )
    }

    // Get the admin role ID from its slug
    const adminRole = await db.select().from(scRoles).where(eq(scRoles.slug, SEEDED_USER_ROLE_SLUGS.ADMIN)).limit(1)
    if (!adminRole || adminRole.length === 0) {
        throw new Error("An error occurred while trying to fetch the admin role, is it seeded?")
    }

    // Attribute the administrator role to that user
    await db.insert(scUserRoles).values({
        userId: defaultAdminUser.id,
        roleId: adminRole[0].id,
    })
}
