import { MAX_ADDRESS_LENGTH } from "#lib/constants/db"
import { AddressType } from "#models/address"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class extends BaseSchema {
    protected tableName = "addresses"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary()

            table.enum("type", Object.values(AddressType)).notNullable()
            table.string("hash", MAX_ADDRESS_LENGTH).notNullable()
            table.specificType("bytecode", `integer ARRAY`).notNullable()
            table.double("balance").checkPositive().notNullable()

            // Relationships
            // Belongs to a chain
            table.integer("chain_id").unsigned().references("id").inTable("chains").notNullable()

            // Belongs to a user
            table.integer("user_id").unsigned().references("id").inTable("users").notNullable()

            // Dates
            table.timestamp("created_at").notNullable()
            table.timestamp("updated_at").notNullable()
            table.timestamp("last_tx_at").notNullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
