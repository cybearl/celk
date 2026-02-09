import { envRuntimeValues, REQUIRED_ENV_VARS } from "@app/config/env"
import { isClient, isServer } from "@cybearl/cypack"

/**
 * Check for required environment variables and throw an error if any are missing.
 */
export function checkEnvironmentVariables() {
    if (Object.keys(REQUIRED_ENV_VARS).length === 0) return

    const environment = isServer() ? "server" : isClient() ? "client" : "unknown"

    let missingVars: string[] = []
    if (environment === "server") {
        missingVars = REQUIRED_ENV_VARS.PRIVATE.filter(varName => envRuntimeValues[varName] === undefined)
    } else if (environment === "client") {
        missingVars = REQUIRED_ENV_VARS.PUBLIC.filter(varName => envRuntimeValues[varName] === undefined)
    } else {
        throw new Error("An error occurred while checking environment variables, the environment is unknown?!")
    }

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
    } else {
        if (environment === "server") {
            console.log(" ✓ All environment variables are loaded.")
        } else {
            console.log("All environment variables are loaded.")
        }
    }

    // Check if any private env vars somehow ended up in the public vars
    if (environment === "client") {
        const privateVarsInPublic = REQUIRED_ENV_VARS.PRIVATE.filter(varName => envRuntimeValues[varName] !== undefined)
        if (privateVarsInPublic.length > 0) {
            console.warn(
                `The following private environment variables are set but should not be exposed: ${privateVarsInPublic.join(", ")}`,
            )
        }
    }
}
