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
        "NEXT_PUBLIC_LOCK_NEW_USERS",
    ],
    PRIVATE: [
        "BETTER_AUTH_SECRET",
        "DATABASE_URL",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "ETHEREUM_RPC_URL",
        "POLYGON_RPC_URL",
        "BITCOIN_RPC_URL",
    ],
}

/**
 * Public environment variables accessible on the frontend (`NEXT_PUBLIC_`).
 */
export const PUBLIC_ENV = {
    version: process.env.VERSION as string,
    nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
    appUrl: process.env.NEXT_PUBLIC_APP_URL as string,
    cgasMarker: process.env.NEXT_PUBLIC_CGAS_MARKER as string,
    appStatus: process.env.NEXT_PUBLIC_APP_STATUS as "enabled" | "disabled" | "in-maintenance" | "in-development",
    lockNewUsers: process.env.NEXT_PUBLIC_LOCK_NEW_USERS === "true",
}

/**
 * Private environment variables accessible only on the server side.
 */
export const PRIVATE_ENV = {
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET as string,
    databaseUrl: process.env.DATABASE_URL as string,
    defaultAdmin: {
        username: process.env.DEFAULT_ADMIN_USERNAME as string | undefined,
        displayUsername: process.env.DEFAULT_ADMIN_DISPLAY_USERNAME as string | undefined,
        name: process.env.DEFAULT_ADMIN_NAME as string | undefined,
        email: process.env.DEFAULT_ADMIN_EMAIL as string | undefined,
        password: process.env.DEFAULT_ADMIN_PASSWORD as string | undefined,
    },
    smtp: {
        host: process.env.SMTP_HOST as string | undefined,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
        user: process.env.SMTP_USER as string | undefined,
        password: process.env.SMTP_PASSWORD as string | undefined,
    },
    rpcs: {
        ethereum: process.env.ETHEREUM_RPC_URL as string | undefined,
        polygon: process.env.POLYGON_RPC_URL as string | undefined,
        bitcoin: process.env.BITCOIN_RPC_URL as string | undefined,
    },
}

/**
 * Trick the compiler into inlining the values for checking.
 */
export const ENV_RUNTIME_VALUES: Record<string, string | undefined> = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CGAS_MARKER: process.env.NEXT_PUBLIC_CGAS_MARKER,
    NEXT_PUBLIC_APP_STATUS: process.env.NEXT_PUBLIC_APP_STATUS,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME,
    DEFAULT_ADMIN_DISPLAY_USERNAME: process.env.DEFAULT_ADMIN_DISPLAY_USERNAME,
    DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME,
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
    NEXT_PUBLIC_LOCK_NEW_USERS: process.env.NEXT_PUBLIC_LOCK_NEW_USERS,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL,
    POLYGON_RPC_URL: process.env.POLYGON_RPC_URL,
    BITCOIN_RPC_URL: process.env.BITCOIN_RPC_URL,
}
