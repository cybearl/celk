import env from "#start/env"
import { defineConfig } from "@adonisjs/lucid"

/**
 * The PostgreSQL connection configuration.
 */
const dbConfig = defineConfig({
    connection: "main",
    connections: {
        main: {
            client: "postgresql",
            connection: {
                host: env.get("POSTGRES_HOST"),
                port: env.get("POSTGRES_PORT"),
                user: env.get("POSTGRES_USER"),
                password: env.get("POSTGRES_PASSWORD"),
                database: env.get("POSTGRES_DB"),
                ssl: true,
            },
            migrations: {
                naturalSort: true,
                paths: ["database/migrations"],
            },
            seeders: {
                paths: ["database/seeders/main"],
            },
            healthCheck: true,
        },
    },
})

export default dbConfig
