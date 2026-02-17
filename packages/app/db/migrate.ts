import { dbClient } from "@app/lib/server/connectors/db"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"

// Manually loading environment variables as
// this is outside of the Next.js runtime
config({ path: "../.env" })

/**
 * Run all the database migrations.
 */
async function main() {
    await migrate(drizzle(dbClient), {
        migrationsFolder: "./db/migrations",
    })

    await dbClient.end()
}

main().catch(err => {
    console.error(`An error occurred while trying to migrate the database: ${err.message}`)
    process.exit(1)
})
