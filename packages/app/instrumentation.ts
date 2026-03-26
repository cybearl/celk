import { PUBLIC_ENV } from "@app/config/env"
import { checkEnvironmentVariables } from "@app/lib/base/utils/env"

/**
 * This function will be called once when a new Next.js server instance is initiated.
 */
export async function register() {
    checkEnvironmentVariables()

    if (PUBLIC_ENV.nextRuntime === "nodejs") {
        const { seedDefaultAdminUser } = await import("@app/lib/server/utils/users")
        await seedDefaultAdminUser()

        const { balanceChecker } = await import("@app/lib/server/instrumentations/balanceChecker")
        balanceChecker.start()

        //const { workersManager } = await import("@app/lib/server/instrumentations/workersManager")
        //await workersManager.start()
    }
}
