import env from "#start/env"
import { defineConfig } from "@adonisjs/lucid"

/**
 * The database connection configuration.
 */
const databaseConfig = defineConfig({
    connection: "main",
    connections: {
        main: {
            client: "pg",
            connection: env.get("DATABASE_URL"),
            migrations: {
                naturalSort: true,
                paths: ["database/migrations"],
            },
            seeders: {
                paths: ["database/seeders/main"],
            },
        },
    },
})

export default databaseConfig
