import { defineConfig } from "drizzle-kit"
import "dotenv/config"

if (!process.env.DATABASE_URL) throw new Error("Missing required environment variable: DATABASE_URL")

/**
 * The configuration for the Drizzle ORM.
 */
const DRIZZLE_CONFIG = defineConfig({
    dialect: "postgresql",
    schema: "./db/schema",
    out: "./db/migrations",
    dbCredentials: {
        url: process.env.DATABASE_URL,
        ssl: "require",
    },
    verbose: true,
    strict: true,
})

export default DRIZZLE_CONFIG
