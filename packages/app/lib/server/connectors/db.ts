import { PRIVATE_ENV, PUBLIC_ENV } from "@app/config/env"
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
        connectionString: PRIVATE_ENV.databaseUrl,
        ssl: {
            rejectUnauthorized: false,
        },
    })

// Writing back to the global variable
if (PUBLIC_ENV.nodeEnv !== "production") globalDbClient.client = dbClient

export const db = drizzle(dbClient, { schema })
