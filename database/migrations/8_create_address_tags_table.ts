import { BaseSchema } from "@adonisjs/lucid/schema"

export default class SkillUsers extends BaseSchema {
    protected tableName = "address_tags"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary()

            // Relationships
            // Belongs to an address
            table.integer("address_id").notNullable().unsigned().references("addresses.id").onDelete("CASCADE")

            // Belongs to a tag
            table.integer("tag_id").notNullable().unsigned().references("tags.id").onDelete("CASCADE")

            // Unique constraint for both (pivot table)
            table.unique(["address_id", "tag_id"])
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
