import { ENV_RUNTIME_VALUES, REQUIRED_ENV_VARS } from "@app/config/env"

/**
 * Check for required environment variables and throws if any are missing.
 *
 * Notes:
 * - Does **not** throw if `NODE_ENV` is set to "production", that prevents a complete crash of the application.
 * - Throws only when the environment is unknown or when required variables are missing.
 * - It also verifies that no private environment variables are exposed in the client environment.
 */
export function checkEnvironmentVariables() {
    if (Object.keys(REQUIRED_ENV_VARS).length === 0) return

    const environment = typeof window === "undefined" ? "server" : typeof window !== "undefined" ? "client" : "unknown"

    let missingVars: string[] = []
    if (environment === "server") {
        missingVars = REQUIRED_ENV_VARS.private.filter(varName => ENV_RUNTIME_VALUES[varName] === undefined)
    } else if (environment === "client") {
        missingVars = REQUIRED_ENV_VARS.public.filter(varName => ENV_RUNTIME_VALUES[varName] === undefined)
    } else {
        if (process.env.NODE_ENV === "production") {
            console.error("An error occurred while checking environment variables, the environment is unknown?!")
        } else {
            throw new Error("An error occurred while checking environment variables, the environment is unknown?!")
        }
    }

    if (missingVars.length > 0) {
        if (process.env.NODE_ENV === "production") {
            console.error(`Missing required environment variables: ${missingVars.join(", ")}`)
        } else {
            throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
        }
    } else {
        console.log(`All required environment variables are set for the '${environment}' environment.`)
    }

    // Check if any private env vars somehow ended up in the public vars
    if (environment === "client") {
        const privateVarsInPublic = REQUIRED_ENV_VARS.private.filter(
            varName => ENV_RUNTIME_VALUES[varName] !== undefined,
        )

        if (privateVarsInPublic.length > 0) {
            if (process.env.NODE_ENV === "production") {
                console.error(
                    `The following private environment variables are set but should not be exposed: ${privateVarsInPublic.join(", ")}`,
                )
            } else {
                throw new Error(
                    `The following private environment variables are set but should not be exposed: ${privateVarsInPublic.join(", ")}`,
                )
            }
        }
    }
}
