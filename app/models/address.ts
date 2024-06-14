import Chain from "#models/chain"
import User from "#models/user"
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm"
import type { BelongsTo } from "@adonisjs/lucid/types/relations"
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

    // Dates
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
