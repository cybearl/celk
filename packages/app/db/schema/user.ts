import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for users.
 */
const scUser = pgTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    username: text("username").notNull().unique(),
    displayUsername: text("display_username").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    imageUrl: text("image_url"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scUser
export type UserSchema = typeof scUser
export type UserSelectModel = InferSelectModel<typeof scUser>
export type UserInsertModel = InferInsertModel<typeof scUser>
