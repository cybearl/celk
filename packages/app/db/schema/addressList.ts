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
    attempts: bigint({ mode: "bigint" }).notNull(),
    lastStatsAttempts: bigint("last_stats_attempts", { mode: "bigint" }),
    lastStatsClosestMatch: text("last_stats_closest_match"),

    // Flags
    isEnabled: boolean("is_enabled").notNull(),
    stopOnFirstMatch: boolean("stop_on_first_match").notNull(),

    // Relationships
    userId: text("user_id")
        .notNull()
        .references(() => scUser.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastStatsAt: timestamp("last_stats_at"),
})

export default scAddressList
export type AddressListSchema = typeof scAddressList
export type AddressListSelectModel = InferSelectModel<typeof scAddressList>
export type AddressListInsertModel = InferInsertModel<typeof scAddressList>

/**
 * A JSON-serializable version of the `AddressListSelectModel` for use in `getServerSideProps` props,
 * `BigInt` fields become strings, date fields become ISO strings.
 */
export type SerializedAddressListSelectModel = Omit<
    AddressListSelectModel,
    "attempts" | "lastStatsAttempts" | "createdAt" | "updatedAt" | "lastStatsAt"
> & {
    attempts: string
    lastStatsAttempts: string | null
    createdAt: string
    updatedAt: string
    lastStatsAt: string | null
}
