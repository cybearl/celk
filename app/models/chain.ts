import { BaseModel, column } from "@adonisjs/lucid/orm"
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
    declare rpcUrls: string[]

    @column()
    declare nativeCurrency: string

    @column()
    declare blockExplorerUrl: string

    // Dates
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
