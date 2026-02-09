import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"

/**
 * The schema for users.
 */
const scUser = pgTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),

    username: text("username").notNull().unique(),
    displayUsername: text("display_username").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    imageUrl: text("image_url"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scUser
export type UserSchema = typeof scUser
