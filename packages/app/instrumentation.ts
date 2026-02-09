import { checkEnvironmentVariables } from "@app/lib/utils/env"
//import { seedDefaultAdminUser } from "@app/lib/utils/users"

/**
 * This function will be called once when a new Next.js server instance is initiated.
 */
export async function register() {
    checkEnvironmentVariables()

    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { seedDefaultAdminUser } = await import("@app/lib/utils/users")
        await seedDefaultAdminUser()
    }
}
