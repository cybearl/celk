import { DateTime } from "luxon"
import hash from "@adonisjs/core/services/hash"
import { compose } from "@adonisjs/core/helpers"
import { BaseModel, column, hasMany, manyToMany } from "@adonisjs/lucid/orm"
import { withAuthFinder } from "@adonisjs/auth/mixins/lucid"
import { DbAccessTokensProvider } from "@adonisjs/auth/access_tokens"
import type { HasMany, ManyToMany } from "@adonisjs/lucid/types/relations"
import Role from "#models/role"
import Address from "#models/address"

// The AuthFinder mixin is used to authenticate users
const AuthFinder = withAuthFinder(() => hash.use("scrypt"), {
    uids: ["email", "username"],
    passwordColumnName: "password",
})

/**
 * The model for a user.
 */
export default class User extends compose(BaseModel, AuthFinder) {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare isSeeded: boolean

    @column()
    declare isLocked: boolean

    @column()
    declare email: string | null

    @column()
    declare username: string | null

    @column({ serializeAs: null })
    declare password: string

    // Relationships
    // Many-to-many relationship with the `roles` table
    @manyToMany(() => Role, {
        pivotTable: "user_roles",
        pivotForeignKey: "user_id",
        pivotRelatedForeignKey: "role_id",
    })
    declare roles: ManyToMany<typeof Role>

    // Has many addresses
    @hasMany(() => Address)
    declare addresses: HasMany<typeof Address>

    // Dates
    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Access tokens for the user
    static accessTokens = DbAccessTokensProvider.forModel(User)
}
