import scConfig, { CONFIG_ID } from "@app/db/schema/config"
import { db } from "@app/lib/server/connectors/db"

/**
 * Seed the default application config into the database.
 */
export default async function seedConfig() {
    await db
        .insert(scConfig)
        .values({
            id: CONFIG_ID,

            // Flags
            lockNewUsers: true,

            // Global stats
            workerReportIntervalMs: 60_000, // 1 minute
            totalAddressesRegistered: 0,
            totalAddressListsCreated: 0,
            totalAttempts: 0n,

            // Limits
            maxAddressesPerUser: 1024,
            maxAddressListsPerUser: 64,
            maxAddressesPerList: 1024,
            maxRunningAddressListsPerUser: 1,

            // Worker
            balanceRefreshDelayMs: 43_200_000, // 12 hours
        })
        .onConflictDoNothing()
}
