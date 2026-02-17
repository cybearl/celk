import { PRIVATE_ENV } from "@app/config/env"
import scRoles from "@app/db/schema/role"
import scUser from "@app/db/schema/user"
import scUserRoles from "@app/db/schema/userRoles"
import { SeededUserRoleSlugs } from "@app/db/seeders/roles"
import auth from "@app/lib/auth"
import { mapBetterAuthUserToDbUser } from "@app/lib/base/utils/auth"
import { db } from "@app/lib/server/connectors/db"
import type { SignUpResponse } from "@app/types/auth"
import { eq } from "drizzle-orm"

/**
 * Seeds the default admin user.
 * @returns The response from the Better Auth sign-up API endpoint.
 */
export async function seedDefaultAdminUser() {
    if (!PRIVATE_ENV.defaultAdmin.email || !PRIVATE_ENV.defaultAdmin.username || !PRIVATE_ENV.defaultAdmin.password) {
        console.log("Skipping default admin user seeding because not all environment variables are set...")
        return
    }

    let response: SignUpResponse | null = null

    try {
        const rawResponse = await auth.api.signUpEmail({
            body: {
                username: PRIVATE_ENV.defaultAdmin.username,
                displayUsername: PRIVATE_ENV.defaultAdmin.displayUsername || PRIVATE_ENV.defaultAdmin.username,
                name: PRIVATE_ENV.defaultAdmin.name || PRIVATE_ENV.defaultAdmin.username,
                email: PRIVATE_ENV.defaultAdmin.email,
                password: PRIVATE_ENV.defaultAdmin.password,
            },
        })

        response = {
            token: rawResponse.token,
            user: mapBetterAuthUserToDbUser(rawResponse.user),
        }

        if (response) console.log("The default admin user has successfully been seeded")
    } catch (error) {
        // Only log if it's not just because the user has already been seeded
        if (!(error instanceof Error) || !error.message.includes("Username is already taken.")) {
            console.error("An error occurred while trying to seed the default admin user:", error)
        }
    }

    if (response) {
        // Automatically verifies the email address of the default admin user
        await db.update(scUser).set({ isEmailVerified: true }).where(eq(scUser.id, response.user.id))

        // Get the admin role ID from its slug
        const adminRole = await db.select().from(scRoles).where(eq(scRoles.slug, SeededUserRoleSlugs.Admin)).limit(1)
        if (!adminRole || adminRole.length === 0) {
            throw new Error("An error occurred while trying to fetch the admin role, is it seeded?")
        }

        // Attribute the administrator role to that user
        await db.insert(scUserRoles).values({
            userId: response.user.id,
            roleId: adminRole[0].id,
        })
    }

    return response
}
