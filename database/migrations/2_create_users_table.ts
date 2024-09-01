import {
    MAX_DESCRIPTION_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_PASSWORD_LENGTH,
    MAX_USERNAME_LENGTH,
} from "#lib/constants/database"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class extends BaseSchema {
    protected tableName = "users"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary()

            table.string("email", MAX_EMAIL_LENGTH).nullable().unique()
            table.string("username", MAX_USERNAME_LENGTH).nullable().unique()
            table.string("password", MAX_PASSWORD_LENGTH).notNullable()
            table.string("description", MAX_DESCRIPTION_LENGTH).nullable()

            // Flags
            table.boolean("is_locked").notNullable().defaultTo(true)

            // Dates
            table.timestamp("created_at").notNullable()
            table.timestamp("updated_at").notNullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
