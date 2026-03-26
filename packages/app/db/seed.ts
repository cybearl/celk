import seeders from "@app/db/seeders"
import { logger } from "@app/lib/base/utils/logger"
import { dbClient } from "@app/lib/server/connectors/db"
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
        logger.error(`Skipping seeding process because of non-recognized 'NODE_ENV': '${process.env.NODE_ENV}'.`)

        process.exit(1)
    }

    // Run all seeders
    for (const [name, seeder] of Object.entries(seeders)) {
        try {
            await seeder()
        } catch (error: any) {
            logger.error(`An error occurred while running seeder '${name}': ${error.message}`)
            continue
        }

        logger.success(`Seeder '${name}' completed successfully.`)
    }

    await dbClient.end()
}

main().catch(error => {
    logger.error("An error occurred while trying to seed the database:", { data: error })
    process.exit(1)
})
