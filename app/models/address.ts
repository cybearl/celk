import Chain from "#models/chain"
import Tag from "#models/tag"
import User from "#models/user"
import { BaseModel, belongsTo, column, manyToMany } from "@adonisjs/lucid/orm"
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations"
import { DateTime } from "luxon"

/**
 * The model for an address.
 */
export default class Address extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare hash: string

    @column()
    declare bytecode: number[]

    @column()
    declare balance: number

    // Relationships
    // Belongs to a chain
    @column()
    declare chainId: number
    @belongsTo(() => Chain)
    declare chain: BelongsTo<typeof Chain>

    // Belongs to a user
    @column()
    declare userId: number
    @belongsTo(() => User)
    declare user: BelongsTo<typeof User>

    // Many-to-many relationship with the `tags` table
    @manyToMany(() => Tag, {
        pivotTable: "address_tags",
        pivotForeignKey: "address_id",
        pivotRelatedForeignKey: "tag_id",
    })
    declare roles: ManyToMany<typeof Tag>

    // Dates
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
