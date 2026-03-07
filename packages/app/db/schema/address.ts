import scUser from "@app/db/schema/user"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { bigint, boolean, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

/**
 * The type of an address.
 */
export enum ADDRESS_TYPE {
    ETHEREUM = "ethereum",
    BTC_P2PKH = "btc_p2pkh", // "1..."   Base58Check
    BTC_P2WPKH = "btc_p2wpkh", // "bc1q..."  Bech32
    BTC_P2SH = "btc_p2sh", // "3..."   Base58Check (nested segwit)
    BTC_P2TR = "btc_p2tr", // "bc1p..."  Bech32m
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
const scAddress = pgTable(
    "addresses",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        name: text("name").notNull(),
        network: PG_ADDRESS_NETWORK().notNull(),
        type: PG_ADDRESS_TYPE().notNull(),
        value: text("value").notNull(),
        privateKey: text("private_key"),
        preEncoding: text("pre_encoding"),
        closestMatch: text("closest_match"),
        balance: bigint("balance", { mode: "bigint" }),
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
        closestMatchRegisteredAt: timestamp("closest_match_registered_at"),
    },
    table => [unique().on(table.userId, table.value)],
)

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
