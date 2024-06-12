import { Env } from "@adonisjs/core/env"

/**
 * Define the environment variables schema, cast and validate values
 * while ensuring that the application is running in a defined set
 * of environments.
 */
export default await Env.create(new URL("../", import.meta.url), {
    // Node env
    NODE_ENV: Env.schema.enum(["development", "production", "test"] as const),

    // Server Host, Port and Timezone
    HOST: Env.schema.string({ format: "host" }),
    PORT: Env.schema.number(),
    TZ: Env.schema.string(),

    // App name and key (AES-256-CBC)
    APP_KEY: Env.schema.string(),

    // Redis database
    REDIS_HOST: Env.schema.string({ format: "host" }),
    REDIS_PORT: Env.schema.number(),
    REDIS_PASSWORD: Env.schema.string(),

    // PostgreSQL database
    POSTGRES_HOST: Env.schema.string({ format: "host" }),
    POSTGRES_PORT: Env.schema.number(),
    POSTGRES_USER: Env.schema.string(),
    POSTGRES_PASSWORD: Env.schema.string(),
    POSTGRES_DB: Env.schema.string(),

    // Default administrator
    DEFAULT_ADMIN_EMAIL: Env.schema.string({ format: "email" }),
    DEFAULT_ADMIN_USERNAME: Env.schema.string(),
    DEFAULT_ADMIN_PASSWORD: Env.schema.string(),
})
