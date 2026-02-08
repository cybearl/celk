import scUser from "@app/db/schema/user"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for user sessions.
 */
const scSession = pgTable("sessions", {
    id: text("id").primaryKey(),

    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Relationships
    userId: text("user_id")
        .notNull()
        .references(() => scUser.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),

    test: text("test").notNull(),
})

export default scSession
export type SessionSchema = typeof scSession
