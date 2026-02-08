import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for users.
 */
const scUser = pgTable("users", {
    id: text("id").primaryKey(),

    username: text("username").notNull().unique(),
    displayUsername: text("display_username").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    imageUrl: text("image_url"),

    // Timestamps
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
})

export default scUser
export type UserSchema = typeof scUser
