import { AddressType } from "#lib/constants/enums"
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
    declare name: string

    @column()
    declare type: AddressType

    @column()
    declare hash: string

    @column()
    declare bytecode: Uint8Array | null

    @column()
    declare balance: number | null

    @column()
    declare txCount: number | null

    // Flags
    @column()
    declare isReady: boolean

    @column()
    declare isLocked: boolean

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

    @column.dateTime()
    declare fetchedAt: DateTime | null

    @column.dateTime()
    declare lastUsedAt: DateTime | null
}
