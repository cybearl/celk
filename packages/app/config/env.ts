/**
 * Required environment variables for the application.
 */
export const REQUIRED_ENV_VARS = {
    PUBLIC: ["NODE_ENV", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_CGAS_MARKER", "NEXT_PUBLIC_APP_STATUS"],
    PRIVATE: ["NODE_ENV", "BETTER_AUTH_SECRET"],
}

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
    betterAuthSecret: process.env.BETTER_AUTH_SECRET as string,
}
