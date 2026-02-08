import { REQUIRED_ENV_VARS } from "@app/config/env"

/**
 * Check for required environment variables and throw an error if any are missing.
 */
function checkEnvironmentVariables() {
    if (Object.keys(process.env).length === 0) return
    if (Object.keys(REQUIRED_ENV_VARS).length === 0) return

    const missingPublicVars = REQUIRED_ENV_VARS.PUBLIC.filter(varName => !process.env[varName])
    const missingPrivateVars = REQUIRED_ENV_VARS.PRIVATE.filter(varName => !process.env[varName])

    const missingVars = [...missingPublicVars, ...missingPrivateVars]

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
    }
}

checkEnvironmentVariables()
