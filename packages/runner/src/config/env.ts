/**
 * Required environment variables for the runner.
 */
export const REQUIRED_ENV_VARS = ["NODE_ENV"]

/**
 * All the environment variables for the runner.
 */
export const ENV = {
    nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
}

/**
 * Trick the compiler into inlining the values for checking.
 */
export const ENV_RUNTIME_VALUES: Record<string, string | undefined> = {
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
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
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    RABBITMQ_WORKER_COMMANDS_QUEUE: process.env.RABBITMQ_WORKER_COMMANDS_QUEUE,
    RABBITMQ_WORKER_EVENTS_QUEUE: process.env.RABBITMQ_WORKER_EVENTS_QUEUE,
    PRIVATE_KEYS_ENCRYPTION_SECRET: process.env.PRIVATE_KEYS_ENCRYPTION_SECRET,
    WORKER_BIN_PATH: process.env.WORKER_BIN_PATH,
    DATA_DIR_PATH: process.env.DATA_DIR_PATH,
}
