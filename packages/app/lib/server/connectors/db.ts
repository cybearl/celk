import schema from "@app/db/schema"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

// Using a global variable to prevent multiple pools in development
const globalDbClient = global as unknown as { client: Pool | undefined }

/**
 * The database client instance, either from the global variable or a new pool.
 */
export const dbClient =
    globalDbClient.client ??
    new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    })

if (process.env.NODE_ENV !== "production") globalDbClient.client = dbClient

export const db = drizzle(dbClient, { schema })
