import scUser from "@app/db/schema/user"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { bigint, boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The type of an address.
 */
export enum ADDRESS_TYPE {
    ETHEREUM = "ethereum",
    BTC_P2PKH = "btc_p2pkh",
    BTC_P2WPKH = "btc_p2wpkh",
}

/**
 * The PG enum for address types.
 */
export const PG_ADDRESS_TYPE = pgEnum("address_type", ADDRESS_TYPE)

/**
 * The network the address belongs to.
 */
export enum ADDRESS_NETWORK {
    BITCOIN = "bitcoin",
    ETHEREUM = "ethereum",
    POLYGON = "polygon",
}

/**
 * The PG enum for address networks.
 */
export const PG_ADDRESS_NETWORK = pgEnum("address_network", ADDRESS_NETWORK)

/**
 * The schema for addresses.
 */
const scAddress = pgTable("addresses", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    name: text("name").notNull(),
    network: PG_ADDRESS_NETWORK().notNull(),
    type: PG_ADDRESS_TYPE().notNull(),
    value: text("value").notNull(),

    // Raw pre-encoding form (e.g., pre-Base58 for BTC)
    preEncoding: text("pre_encoding").notNull(),

    // Only if successfully brute-forced, never set by users
    privateKey: text("private_key"),

    // An automatically refreshed balance
    balance: bigint("balance", { mode: "bigint" }),

    // The total number of brute force attempts (big integer)
    // Independent of the lists that the address is in
    attempts: bigint({ mode: "bigint" }).notNull(),

    // Flags
    isDisabled: boolean("is_disabled").notNull(),

    // Relationships
    userId: text("user_id")
        .notNull()
        .references(() => scUser.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    balanceCheckedAt: timestamp("balance_checked_at"),
})

export default scAddress
export type AddressSchema = typeof scAddress
export type AddressSelectModel = InferSelectModel<typeof scAddress>
export type AddressInsertModel = InferInsertModel<typeof scAddress>

/**
 * A JSON-serializable version of `AddressSelectModel` for use in `getServerSideProps` props,
 * `BigInt` fields become strings, date fields become ISO strings.
 */
export type SerializedAddressSelectModel = Omit<
    AddressSelectModel,
    "balance" | "attempts" | "createdAt" | "updatedAt" | "balanceCheckedAt"
> & {
    balance: string | null
    attempts: string
    createdAt: string
    updatedAt: string
    balanceCheckedAt: string | null
}
