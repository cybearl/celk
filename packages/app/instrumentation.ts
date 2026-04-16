import { checkEnvironmentVariables } from "@app/lib/base/utils/env"

/**
 * This function is called once when a new Next.js server instance is initiated.
 */
export async function register() {
    checkEnvironmentVariables()

    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { seedDefaultAdminUser } = await import("@app/lib/server/instrumentations/defaultAdminSeeder")
        await seedDefaultAdminUser()

        const { balanceChecker } = await import("@app/lib/server/instrumentations/balanceChecker")
        balanceChecker.start()

        const { workersOrchestrator } = await import("@app/lib/server/instrumentations/workersOrchestrator")
        await workersOrchestrator.start()
    }
}
