import Address from "#models/address"
import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm"
import type { ManyToMany } from "@adonisjs/lucid/types/relations"
import { DateTime } from "luxon"

/**
 * The model for a tag, can be used at different moments in the application,
 * to modify the behavior of the generators etc..
 */
export default class Tag extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare description: string

    // Relationships
    // Many-to-many relationship with the `addresses` table
    @manyToMany(() => Address, {
        pivotTable: "address_tags",
        pivotForeignKey: "tag_id",
        pivotRelatedForeignKey: "address_id",
    })
    declare addresses: ManyToMany<typeof Address>

    // Dates
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
