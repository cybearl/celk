import { BaseSchema } from "@adonisjs/lucid/schema"
import { constants } from "@cybearl/cypack"

export default class extends BaseSchema {
    protected tableName = "roles"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary()

            table.string("name", constants.MAX_NAME_LENGTH).notNullable().unique()
            table.string("description", constants.MAX_DESCRIPTION_LENGTH).notNullable()

            // Dates
            table.timestamp("created_at").notNullable()
            table.timestamp("updated_at").notNullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
