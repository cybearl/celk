import { dbClient } from "@app/lib/connectors/db"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"

// Manually loading environment variables as
// this is outside of the Next.js runtime
config({ path: "../.env" })

async function main() {
    await migrate(drizzle(dbClient), {
        migrationsFolder: "./db/migrations",
    })

    await dbClient.end()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
