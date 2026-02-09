//import { checkEnvironmentVariables } from "@app/lib/utils/env"
import { seedDefaultAdminUser } from "@app/lib/utils/users"

/**
 * This function will be called once when a new Next.js server instance is initiated.
 */
export async function register() {
    //checkEnvironmentVariables()
    await seedDefaultAdminUser()
}
