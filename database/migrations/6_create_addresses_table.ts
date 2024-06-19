import { MAX_ADDRESS_LENGTH } from "#lib/constants/db"
import { AddressType } from "#models/address"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class extends BaseSchema {
    protected tableName = "addresses"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary()

            table.enum("type", Object.values(AddressType)).notNullable()
            table.string("hash", MAX_ADDRESS_LENGTH).notNullable().unique()
            table.specificType("bytecode", `bytea`).nullable()
            table.double("balance").checkPositive().nullable()
            table.integer("tx_count").checkPositive().nullable()

            // Flags
            table.boolean("is_ready").notNullable().defaultTo(false)
            table.boolean("is_locked").notNullable().defaultTo(false)

            // Relationships
            // Belongs to a chain
            table.integer("chain_id").unsigned().references("id").inTable("chains").notNullable()

            // Belongs to a user
            table.integer("user_id").unsigned().references("id").inTable("users").notNullable()

            // Dates
            table.timestamp("created_at").notNullable()
            table.timestamp("updated_at").notNullable()
            table.timestamp("fetched_at").nullable()
            table.timestamp("last_used_at").nullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
