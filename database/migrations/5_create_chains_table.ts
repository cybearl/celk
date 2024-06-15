import { MAX_NAME_LENGTH, MAX_NATIVE_CURRENCY_LENGTH, MAX_URL_LENGTH } from "#lib/constants/db"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class extends BaseSchema {
    protected tableName = "chains"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.integer("id").primary()

            table.string("name", MAX_NAME_LENGTH).notNullable()
            table.string("native_currency", MAX_NATIVE_CURRENCY_LENGTH).notNullable()
            table.string("explorer_url", MAX_URL_LENGTH).notNullable()

            // Dates
            table.timestamp("created_at").notNullable()
            table.timestamp("updated_at").notNullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
