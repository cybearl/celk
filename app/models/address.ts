import Chain from "#models/chain"
import User from "#models/user"
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm"
import type { BelongsTo } from "@adonisjs/lucid/types/relations"
import { DateTime } from "luxon"

/**
 * The type of an address.
 *
 * See https://bitbox.swiss/blog/content/images/2021/10/grafik-1.png for more information.
 */
export enum AddressType {
    P2TR = "BTC::P2TR", // Pay to Taproot
    P2WPKH = "BTC::P2WPKH", // Pay to Witness Public Key Hash (SegWit)
    P2SH_P2WPKH = "BTC::P2SH_P2WPKH", // Pay to Script Hash (Legacy SegWit)
    P2PKH = "BTC::P2PKH", // Pay to Public Key Hash (Legacy)
    ETH = "ETH::ETH", // Ethereum
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
    declare bytecode: number[] | null

    @column()
    declare balance: number | null

    @column()
    declare txCount: number | null

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
