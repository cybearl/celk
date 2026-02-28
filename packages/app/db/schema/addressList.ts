import scUser from "@app/db/schema/user"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { bigint, boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for address lists.
 */
const scAddressList = pgTable("address_lists", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    name: text("name").notNull(),
    description: text("description"),

    // Worker control flags
    isEnabled: boolean("is_enabled").notNull(), // Worker spawns while true
    stopOnFirstMatch: boolean("stop_on_first_match").notNull(),

    // Lifetime attempt counter for this list
    attempts: bigint({ mode: "bigint" }).notNull(),

    // Last stats snapshot (populated after each worker report)
    lastStatsAttempts: bigint("last_stats_attempts", { mode: "bigint" }),
    lastStatsClosestMatch: text("last_stats_closest_match"),
    lastStatsAt: timestamp("last_stats_at"),

    // Relationships
    userId: text("user_id")
        .notNull()
        .references(() => scUser.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scAddressList
export type AddressListSchema = typeof scAddressList
export type AddressListSelectModel = InferSelectModel<typeof scAddressList>
export type AddressListInsertModel = InferInsertModel<typeof scAddressList>
