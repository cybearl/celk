import { JobMode, JobStatus } from "#lib/constants/enums"
import Address from "#models/address"
import User from "#models/user"
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm"
import type { BelongsTo } from "@adonisjs/lucid/types/relations"
import { DateTime } from "luxon"

export default class Job extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare mode: JobMode

    @column()
    declare lowerBound: string // Hexadecimal string -> bigint (inclusive)

    @column()
    declare upperBound: string // Hexadecimal string -> bigint (inclusive)

    @column()
    declare storage: string // JSON stringified object to store any additional data depending on the mode

    @column()
    declare status: JobStatus

    @column()
    declare attempts: number

    @column()
    declare result: string | null

    @column()
    declare error: string | null // JSON stringified object with error details

    // Relationships
    // Belongs to an address
    @column()
    declare addressId: number
    @belongsTo(() => Address)
    declare address: BelongsTo<typeof Address>

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
    declare startedAt: DateTime | null

    @column.dateTime()
    declare stoppedAt: DateTime | null
}
