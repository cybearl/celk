import { REQUIRED_ENV_VARS } from "@app/config/env"

/**
 * Public environment variables accessible on the frontend (`NEXT_PUBLIC_`).
 */
export const PUBLIC_ENV = {
    nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
    appUrl: process.env.NEXT_PUBLIC_APP_URL as string,
    cgasMarker: process.env.NEXT_PUBLIC_CGAS_MARKER as string,
    appStatus: process.env.NEXT_PUBLIC_APP_STATUS as "enabled" | "disabled" | "in-maintenance" | "in-development",
}

/**
 * Private environment variables accessible only on the server side.
 */
export const PRIVATE_ENV = {
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
}

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
