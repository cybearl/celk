import { MAX_ADDRESS_LENGTH, MAX_NAME_LENGTH } from "#lib/constants/database"
import { AddressType } from "#lib/constants/enums"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class extends BaseSchema {
    protected tableName = "addresses"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary()

            table.string("name", MAX_NAME_LENGTH).notNullable()
            table.enum("type", Object.values(AddressType)).notNullable()
            table.string("hash", MAX_ADDRESS_LENGTH).notNullable()
            table.specificType("bytecode", `bytea`).nullable()
            table.double("balance").nullable()
            table.integer("tx_count").nullable()

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
