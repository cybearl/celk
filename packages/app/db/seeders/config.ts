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
            attempts: 0n,
            addressesRegistered: 0,
            addressListsCreated: 0,

            // Limits
            maxAddressesPerUser: 1024,
            maxAddressListsPerUser: 64,
            maxAddressesPerList: 1024,
            maxRunningAddressListsPerUser: 1,

            // Workers manager intervals
            balanceRefreshDelayMs: 43_200_000, // 12 hours
            workerPollIntervalMs: 10_000, // 10 seconds
            workerReportIntervalMs: 60_000, // 1 minute

            // Workers manager sync settings
            maxSyncRetries: 5,
            syncRetryBaseDelayMs: 5000, // 5 seconds
            syncRetryMaxDelayMs: 3_600_000, // 1 hour
        })
        .onConflictDoNothing()
}
