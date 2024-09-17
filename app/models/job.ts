import Address from "#models/address"
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm"
import type { BelongsTo } from "@adonisjs/lucid/types/relations"

export default class Job extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare mode: string

    // @column()
    // declare attempts: number

    // Relationships
    // Belongs to an address
    @column()
    declare addressId: number
    @belongsTo(() => Address)
    declare address: BelongsTo<typeof Address>
}
