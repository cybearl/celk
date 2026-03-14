import { PRIVATE_ENV } from "@app/config/env"
import scUser from "@app/db/schema/user"
import auth from "@app/lib/auth"
import { normalizeUser } from "@app/lib/base/utils/auth"
import { logger } from "@app/lib/base/utils/logger"
import { db } from "@app/lib/server/connectors/db"
import type { SignUpResponse } from "@app/types/auth"
import { eq } from "drizzle-orm"

/**
 * Seeds the default admin user.
 * @returns The response from the Better Auth sign-up API endpoint.
 */
export async function seedDefaultAdminUser() {
    if (!PRIVATE_ENV.defaultAdmin.email || !PRIVATE_ENV.defaultAdmin.username || !PRIVATE_ENV.defaultAdmin.password) {
        throw new Error("No default admin user seeding because not all environment variables are set...")
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
            user: normalizeUser(rawResponse.user),
        }

        if (response) logger.success(`The default admin user has successfully been seeded.`)
    } catch (error) {
        // Only log if it's not just because the user has already been seeded
        if (!(error instanceof Error) || !error.message.includes("Username is already taken.")) {
            logger.error(`An error occurred while trying to seed the default admin user`, { data: error })
        }
    }

    if (response) {
        // Automatically verifies the email address and unlocks the default admin user
        await db.update(scUser).set({ isEmailVerified: true, isLocked: false }).where(eq(scUser.id, response.user.id))
    }

    return response
}
