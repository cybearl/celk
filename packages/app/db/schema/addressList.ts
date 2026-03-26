import scUser from "@app/db/schema/user"
import { WORKER_STATUS } from "@app/lib/server/instrumentations/workersManager/protocol"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { boolean, numeric, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

/**
 * The PG enum for worker statuses.
 */
export const PG_WORKER_STATUS = pgEnum("address_list_worker_status", WORKER_STATUS)

/**
 * The schema for address lists.
 */
const scAddressList = pgTable(
    "address_lists",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        name: text("name").notNull(),
        description: text("description"),
        attempts: numeric("attempts").notNull(),
        workerStatus: PG_WORKER_STATUS("worker_status").notNull(),
        latestDumpId: text("latest_dump_id"),

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
    },
    table => [unique("address_lists_user_id_name_unique").on(table.userId, table.name)],
)

export default scAddressList
export type AddressListSchema = typeof scAddressList
export type AddressListSelectModel = InferSelectModel<typeof scAddressList>
export type AddressListInsertModel = InferInsertModel<typeof scAddressList>

/**
 * A JSON-serializable version of the `AddressListSelectModel` for use in `getServerSideProps` props:
 * - Date fields become ISO strings.
 */
export type SerializedAddressListSelectModel = Omit<AddressListSelectModel, "createdAt" | "updatedAt"> & {
    createdAt: string
    updatedAt: string
}
