import { checkEnvironmentVariables } from "@app/lib/base/utils/env"

/**
 * This function will be called once when a new Next.js server instance is initiated.
 */
export async function register() {
    checkEnvironmentVariables()

    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { seedDefaultAdminUser } = await import("@app/lib/server/utils/users")
        await seedDefaultAdminUser()
    }
}
