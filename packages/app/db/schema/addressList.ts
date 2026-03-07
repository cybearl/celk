import scUser from "@app/db/schema/user"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { bigint, boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The status of a worker attached to an address list.
 */
export enum ADDRESS_LIST_WORKER_STATUS {
    IDLE = "idle",
    RUNNING = "running",
    FAILED = "failed",
}

/**
 * The PG enum for address list worker statuses.
 */
export const PG_ADDRESS_LIST_WORKER_STATUS = pgEnum("address_list_worker_status", ADDRESS_LIST_WORKER_STATUS)

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
    workerStatus: PG_ADDRESS_LIST_WORKER_STATUS("worker_status").notNull(),

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
})

export default scAddressList
export type AddressListSchema = typeof scAddressList
export type AddressListSelectModel = InferSelectModel<typeof scAddressList>
export type AddressListInsertModel = InferInsertModel<typeof scAddressList>

/**
 * A JSON-serializable version of the `AddressListSelectModel` for use in `getServerSideProps` props,
 * `BigInt` fields become strings, date fields become ISO strings.
 */
export type SerializedAddressListSelectModel = Omit<AddressListSelectModel, "attempts" | "createdAt" | "updatedAt"> & {
    attempts: string
    createdAt: string
    updatedAt: string
}
