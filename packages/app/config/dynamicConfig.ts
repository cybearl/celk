import { DYNAMIC_CONFIG_ID, type DynamicConfigInsertModel } from "@app/db/schema/dynamicConfig"

/**
 * The values of the main dynamic application configuration of the application,
 * used both for initial seeding, and as a fallback when the
 * config cannot be loaded from the DB.
 */
const DYNAMIC_CONFIG: DynamicConfigInsertModel = {
    id: DYNAMIC_CONFIG_ID,

    // Flags
    lockNewUsers: true,

    // Global stats
    attempts: "0",

    // Limits
    maxAddressesPerUser: 1024,
    maxAddressListsPerUser: 64,
    maxAddressesPerList: 1024,
    maxRunningAddressListsPerUser: 1,

    // Balance checker settings
    balanceCheckerDelayMs: 600_000, // 10 minutes
    maxBalanceCheckerRetries: 5,
    balanceCheckerRetryBaseDelayMs: 5000, // 5 seconds
    balanceCheckerRetryMaxDelayMs: 3_600_000, // 1 hour

    // Workers manager settings
    workersManagerPollIntervalMs: 10_000, // 10 seconds
    maxWorkersManagerSyncRetries: 5,
    workersManagerSyncRetryBaseDelayMs: 5000, // 5 seconds
    workersManagerSyncRetryMaxDelayMs: 3_600_000, // 1 hour

    // Worker settings
    workerReportIntervalMs: 4_000, // 4 seconds
}

export default DYNAMIC_CONFIG
