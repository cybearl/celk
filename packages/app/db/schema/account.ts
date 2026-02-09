import scUser from "@app/db/schema/user"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"

/**
 * The schema for user accounts.
 */
const scAccount = pgTable("accounts", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),

    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),

    // Relationships
    userId: text("user_id")
        .notNull()
        .references(() => scUser.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
})

export default scAccount
export type AccountSchema = typeof scAccount
