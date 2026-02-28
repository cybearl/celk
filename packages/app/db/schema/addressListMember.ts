import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { bigint, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

/**
 * The schema for address list members (pivot table).
 */
const scPvtAddressListMember = pgTable(
    "address_list_members",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        // Per-membership attempt counter, independent of the global address counter
        attempts: bigint({ mode: "bigint" }).notNull(),

        // Relationships
        addressListId: text("address_list_id")
            .notNull()
            .references(() => scAddressList.id, { onDelete: "cascade" }),

        addressId: text("address_id")
            .notNull()
            .references(() => scAddress.id, { onDelete: "cascade" }),

        // Timestamps
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    table => [unique().on(table.addressListId, table.addressId)],
)

export default scPvtAddressListMember
export type PvtAddressListMemberSchema = typeof scPvtAddressListMember
export type PvtAddressListMemberSelectModel = InferSelectModel<typeof scPvtAddressListMember>
export type PvtAddressListMemberInsertModel = InferInsertModel<typeof scPvtAddressListMember>
