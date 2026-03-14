import { createInterface } from "node:readline"
import { logger } from "@app/lib/base/utils/logger"
import { config } from "dotenv"
import { Pool } from "pg"

// Manually loading environment variables as
// this is outside of the Next.js runtime
config({ path: "../.env" })

if (!process.env.DATABASE_URL) throw new Error("Missing required environment variable: DATABASE_URL")

/**
 * Drop and recreate the public schema, wiping all tables, enums, and constraints.
 */
async function main() {
    const readline = createInterface({ input: process.stdin, output: process.stdout })
    await new Promise<void>((resolve, reject) => {
        readline.question("This will permanently delete ALL data. Type 'yes' to confirm: ", answer => {
            readline.close()
            if (answer.trim().toLowerCase() === "yes") resolve()
            else reject(new Error("Reset cancelled."))
        })
    })

    const client = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })

    // Terminate all other connections so DROP SCHEMA doesn't block
    await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
    `)

    await client.query("DROP SCHEMA public CASCADE")
    await client.query("DROP SCHEMA IF EXISTS drizzle CASCADE")
    await client.query("CREATE SCHEMA public")
    await client.query("GRANT ALL ON SCHEMA public TO public")

    logger.success(`The database has been reset successfully.`)
    await client.end()
}

main().catch(error => {
    logger.error(`An error occurred while trying to reset the database`, { data: error })
    process.exit(1)
})
