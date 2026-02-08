import seeders from "@app/db/seeders"
import { dbClient } from "@app/lib/connectors/db"
import { config } from "dotenv"

// Manually loading environment variables as
// this is outside of the Next.js runtime
config({ path: "../.env" })

/**
 * Environments valid for the seeding process.
 */
const validEnvs: string[] = ["development", "production", "test"]

/**
 * Seed the database with initial data.
 */
async function main() {
    if (!process.env.NODE_ENV || !validEnvs.includes(process.env.NODE_ENV)) {
        console.error(`Skipping seeding process because of non-recognized 'NODE_ENV': '${process.env.NODE_ENV}'`)

        process.exit(1)
    }

    // Run all seeders
    for (const [name, seeder] of Object.entries(seeders)) {
        console.log(`Running seeder: '${name}'`)

        try {
            await seeder()
        } catch (error: any) {
            console.error(`An error occurred while running seeder '${name}': ${error.message}`)
        }
    }

    await dbClient.end()
}

main().catch(err => {
    console.error(`An error occurred while trying to seed the database: ${err.message}`)
    process.exit(1)
})
