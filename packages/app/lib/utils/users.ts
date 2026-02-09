import auth from "@app/auth"
import { PRIVATE_ENV } from "@app/config/env"
import type { SignUpResponse } from "@app/types/auth"

/**
 * Seeds the default admin user.
 * @returns The response from the BetterAuth sign-up API endpoint.
 */
export async function seedDefaultAdminUser() {
    if (!PRIVATE_ENV.defaultAdmin.email || !PRIVATE_ENV.defaultAdmin.username || !PRIVATE_ENV.defaultAdmin.password) {
        console.log("Skipping default admin user seeding because not all environment variables are set...")
        return
    }

    let response: SignUpResponse | null = null

    try {
        response = (await auth.api.signUpEmail({
            body: {
                username: PRIVATE_ENV.defaultAdmin.username,
                displayUsername: PRIVATE_ENV.defaultAdmin.displayUsername || PRIVATE_ENV.defaultAdmin.username,
                name: PRIVATE_ENV.defaultAdmin.name || PRIVATE_ENV.defaultAdmin.username,
                email: PRIVATE_ENV.defaultAdmin.email,
                password: PRIVATE_ENV.defaultAdmin.password,
            },
        })) as SignUpResponse

        if (response) console.log("The default admin user has successfully been seeded")
    } catch (error) {
        // Only log if it's not just because the user has already been seeded
        if (!(error instanceof Error) || !error.message.includes("Username is already taken.")) {
            console.error("An error occurred while trying to seed the default admin user:", error)
        }
    }

    return response
}
