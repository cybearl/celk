import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for user account verifications.
 */
const scVerification = pgTable("verifications", {
    id: text("id").primaryKey(),

    identifier: text("identifier").notNull(),
    value: text("value").notNull(),

    // Timestamps
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    expiresAt: timestamp("expires_at").notNull(),
})

export default scVerification
export type VerificationSchema = typeof scVerification
