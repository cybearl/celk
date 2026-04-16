import scUser from "@app/db/schema/user"
import { ADDRESS_NETWORK, ADDRESS_PRIVATE_KEY_GENERATOR, ADDRESS_TYPE } from "@cybearl/celk-protocol"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

/**
 * The PG enum for address types.
 */
export const PG_ADDRESS_TYPE = pgEnum("address_type", ADDRESS_TYPE)

/**
 * The PG enum for address networks.
 */
export const PG_ADDRESS_NETWORK = pgEnum("address_network", ADDRESS_NETWORK)

/**
 * The PG enum for private key generators.
 */
export const PG_ADDRESS_PRIVATE_KEY_GENERATOR = pgEnum("address_private_key_generator", ADDRESS_PRIVATE_KEY_GENERATOR)

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
        description: text("description"),
        network: PG_ADDRESS_NETWORK().notNull(),
        type: PG_ADDRESS_TYPE().notNull(),
        value: text("value").notNull(),
        preEncoding: text("pre_encoding"),
        closestMatch: integer("closest_match").notNull(), // Number of bytes reached (e.g., 20 for full match, 0 for no match)
        balance: numeric("balance"),
        attempts: numeric("attempts").notNull(),

        // Private key and optional ranges for its generation
        privateKeyGenerator: PG_ADDRESS_PRIVATE_KEY_GENERATOR("private_key_generator").notNull(),
        encryptedPrivateKey: text("encrypted_private_key"),
        privateKeyRangeStart: numeric("private_key_range_start"),
        privateKeyRangeEnd: numeric("private_key_range_end"),

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
    table => [
        unique("addresses_user_id_name_unique").on(table.userId, table.name),
        unique("addresses_user_id_value_unique").on(table.userId, table.value),
    ],
)

export default scAddress
export type AddressSchema = typeof scAddress
export type AddressSelectModel = InferSelectModel<typeof scAddress>
export type AddressInsertModel = InferInsertModel<typeof scAddress>

/**
 * A JSON-serializable version of `AddressSelectModel` for use in `getServerSideProps` props:
 * - Date fields become ISO strings.
 */
export type SerializedAddressSelectModel = Omit<
    AddressSelectModel,
    "createdAt" | "updatedAt" | "balanceCheckedAt" | "closestMatchRegisteredAt"
> & {
    createdAt: string
    updatedAt: string
    balanceCheckedAt: string | null
    closestMatchRegisteredAt: string | null
}
