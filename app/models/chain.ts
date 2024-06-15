import Address from "#models/address"
import { BaseModel, column, hasMany } from "@adonisjs/lucid/orm"
import type { HasMany } from "@adonisjs/lucid/types/relations"
import { DateTime } from "luxon"

/**
 * The model for a chain.
 */
export default class Chain extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare apiUrls: string[]

    @column()
    declare nativeCurrency: string

    @column()
    declare explorerUrl: string

    // Relationships
    // Has many addresses
    @hasMany(() => Address)
    declare addresses: HasMany<typeof Address>

    // Dates
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
