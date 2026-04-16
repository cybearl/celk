import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { boolean, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The identifier of the singleton dynamic application config row.
 */
export const DYNAMIC_CONFIG_ID = "dynamic_config"

/**
 * The schema for the dynamic application config.
 *
 * This table always contains exactly one row identified by `DYNAMIC_CONFIG_ID`.
 * It stores runtime-changeable settings that an admin can update without
 * touching environment variables or redeploying.
 */
const scDynamicConfig = pgTable("dynamic_config", {
    id: text("id").primaryKey(),

    // Flags
    lockNewUsers: boolean("lock_new_users").notNull(),

    // Global stats
    attempts: numeric("attempts").notNull(),

    // Limits
    maxAddressesPerUser: integer("max_addresses_per_user").notNull(),
    maxAddressListsPerUser: integer("max_address_lists_per_user").notNull(),
    maxAddressesPerList: integer("max_addresses_per_list").notNull(),
    maxRunningAddressListsPerUser: integer("max_running_address_lists_per_user").notNull(),

    // Balance checker settings
    balanceCheckerDelayMs: integer("balance_checker_delay_ms").notNull(),
    maxBalanceCheckerRetries: integer("max_balance_checker_retries").notNull(),
    balanceCheckerRetryBaseDelayMs: integer("balance_checker_retry_base_delay_ms").notNull(),
    balanceCheckerRetryMaxDelayMs: integer("balance_checker_retry_max_delay_ms").notNull(),

    // Workers manager settings
    workersManagerPollIntervalMs: integer("workers_manager_poll_interval_ms").notNull(),
    maxWorkersManagerSyncRetries: integer("max_workers_manager_sync_retries").notNull(),
    workersManagerSyncRetryBaseDelayMs: integer("workers_manager_sync_retry_base_delay_ms").notNull(),
    workersManagerSyncRetryMaxDelayMs: integer("workers_manager_sync_retry_max_delay_ms").notNull(),

    // Worker settings
    workerReportIntervalMs: integer("worker_report_interval_ms").notNull(),
    workerHeartbeatIntervalMs: integer("worker_heartbeat_interval_ms").notNull(),
    workerHeartbeatTimeoutMs: integer("worker_heartbeat_timeout_ms").notNull(),

    // Timestamps
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scDynamicConfig
export type DynamicConfigSchema = typeof scDynamicConfig
export type DynamicConfigSelectModel = InferSelectModel<typeof scDynamicConfig>
export type DynamicConfigInsertModel = InferInsertModel<typeof scDynamicConfig>

/**
 * A JSON-serializable version of the `DynamicConfigSelectModel` for use in `getServerSideProps` props:
 * - Date fields become ISO strings.
 */
export type SerializedDynamicConfigSelectModel = Omit<DynamicConfigSelectModel, "attempts" | "updatedAt"> & {
    updatedAt: string
}
