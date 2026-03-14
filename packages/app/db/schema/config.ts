import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { bigint, boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The identifier of the singleton config row.
 */
export const CONFIG_ID = "config"

/**
 * The schema for the application config.
 *
 * This table always contains exactly one row identified by `CONFIG_ID`.
 * It stores runtime-changeable settings that an admin can update without
 * touching environment variables or redeploying.
 */
const scConfig = pgTable("config", {
    id: text("id").primaryKey(),

    // Flags
    lockNewUsers: boolean("lock_new_users").notNull(),

    // Global stats
    attempts: bigint({ mode: "bigint" }).notNull(),
    addressesRegistered: integer("addresses_registered").notNull(),
    addressListsCreated: integer("address_lists_created").notNull(),

    // Limits
    maxAddressesPerUser: integer("max_addresses_per_user").notNull(),
    maxAddressListsPerUser: integer("max_address_lists_per_user").notNull(),
    maxAddressesPerList: integer("max_addresses_per_list").notNull(),
    maxRunningAddressListsPerUser: integer("max_running_address_lists_per_user").notNull(),

    // Workers manager intervals
    balanceRefreshDelayMs: integer("balance_refresh_delay_ms").notNull(),
    workerPollIntervalMs: integer("worker_poll_interval_ms").notNull(),
    workerReportIntervalMs: integer("worker_report_interval_ms").notNull(),

    // Workers manager sync settings
    maxSyncRetries: integer("max_sync_retries").notNull(),
    syncRetryBaseDelayMs: integer("sync_retry_base_delay_ms").notNull(),
    syncRetryMaxDelayMs: integer("sync_retry_max_delay_ms").notNull(),

    // Timestamps
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scConfig
export type ConfigSchema = typeof scConfig
export type ConfigSelectModel = InferSelectModel<typeof scConfig>
export type ConfigInsertModel = InferInsertModel<typeof scConfig>

/**
 * A JSON-serializable version of the `ConfigSelectModel` for use in `getServerSideProps` props,
 * `BigInt` fields become strings, date fields become ISO strings.
 */
export type SerializedConfigSelectModel = Omit<ConfigSelectModel, "attempts" | "updatedAt"> & {
    attempts: string
    updatedAt: string
}
