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
            totalAddressesRegistered: 0,
            totalAddressListsCreated: 0,
            totalAttempts: 0n,

            // Limits
            maxAddressesPerUser: 1024,
            maxAddressListsPerUser: 64,
            maxAddressesPerList: 1024,
            maxRunningAddressLists: 1,

            // Worker
            balanceRefreshDelayMs: 60_000,
        })
        .onConflictDoNothing()
}
