/**
 * Required environment variables for the application.
 */
export const REQUIRED_ENV_VARS = {
    PUBLIC: [
        "NODE_ENV",
        "NEXT_PUBLIC_LOG_LEVEL",
        "NEXT_PUBLIC_APP_URL",
        "NEXT_PUBLIC_CGAS_MARKER",
        "NEXT_PUBLIC_APP_STATUS",
    ],
    PRIVATE: ["NODE_ENV", "BETTER_AUTH_SECRET", "DATABASE_URL"],
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
    databaseUrl: process.env.DATABASE_URL as string,
    defaultAdmin: {
        username: process.env.DEFAULT_ADMIN_USERNAME as string | undefined,
        displayUsername: process.env.DEFAULT_ADMIN_DISPLAY_USERNAME as string | undefined,
        name: process.env.DEFAULT_ADMIN_NAME as string | undefined,
        email: process.env.DEFAULT_ADMIN_EMAIL as string | undefined,
        password: process.env.DEFAULT_ADMIN_PASSWORD as string | undefined,
    },
}

/**
 * Trick the compiler into inlining the values for checking.
 */
//export const envRuntimeValues: Record<string, string | undefined> = {
//    PORT: process.env.PORT,
//    NODE_ENV: process.env.NODE_ENV,
//    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
//    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
//    NEXT_PUBLIC_CGAS_MARKER: process.env.NEXT_PUBLIC_CGAS_MARKER,
//    NEXT_PUBLIC_APP_STATUS: process.env.NEXT_PUBLIC_APP_STATUS,
//    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
//    DATABASE_URL: process.env.DATABASE_URL,
//    DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME,
//    DEFAULT_ADMIN_DISPLAY_USERNAME: process.env.DEFAULT_ADMIN_DISPLAY_USERNAME,
//    DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME,
//    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL,
//    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
//}
