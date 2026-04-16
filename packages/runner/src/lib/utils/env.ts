import { ENV_RUNTIME_VALUES, REQUIRED_ENV_VARS } from "@runner/config/env"
import { logger } from "@runner/lib/utils/logger"

/**
 * Checks for required environment variables and throws if any are missing.
 *
 * Notes:
 * - Does **not** throw if `NODE_ENV` is set to "production", that prevents a complete crash of the application.
 */
export function checkEnvironmentVariables() {
    if (Object.keys(REQUIRED_ENV_VARS).length === 0) return

    const missingVars = REQUIRED_ENV_VARS.filter(varName => ENV_RUNTIME_VALUES[varName] === undefined)

    if (missingVars.length > 0) {
        if (process.env.NODE_ENV === "production") {
            logger.error(`Missing required environment variables: ${missingVars.join(", ")}`)
        } else {
            throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
        }
    } else {
        logger.success(`All required environment variables are set for the environment.`)
    }
}
