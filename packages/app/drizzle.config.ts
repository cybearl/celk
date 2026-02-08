/** biome-ignore-all lint/suspicious/noDuplicateObjectKeys: Defined by Drizzle itself */
import "dotenv/config"
import { defineConfig } from "drizzle-kit"

if (!process.env.DATABASE_URL) throw new Error("Missing required environment variable: DATABASE_URL")

/**
 * The configuration for the Drizzle ORM.
 */
const DRIZZLE_CONFIG = defineConfig({
    schema: "./db/schema",
    out: "./db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
        ssl: "require",
    },
    verbose: true,
    strict: true,
})

export default DRIZZLE_CONFIG
