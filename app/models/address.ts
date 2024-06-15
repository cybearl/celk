import Chain from "#models/chain"
import User from "#models/user"
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm"
import type { BelongsTo } from "@adonisjs/lucid/types/relations"
import { DateTime } from "luxon"

/**
 * The type of the address.
 */
export enum AddressType {
    P2PKH = "BTC::P2PKH",
    P2SH = "BTC::P2SH",
    P2WPKH = "BTC::P2WPKH",
    P2WSH = "BTC::P2WSH",
    P2TR = "BTC::P2TR",
    ETH = "ETH::ETH",
}

/**
 * The model for an address.
 */
export default class Address extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare type: AddressType

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

    // Dates
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @column.dateTime()
    declare lastTxAt: DateTime
}
