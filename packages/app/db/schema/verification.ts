import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"

/**
 * The schema for user account verifications.
 */
const scVerification = pgTable("verifications", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),

    identifier: text("identifier").notNull(),
    value: text("value").notNull(),

    // Timestamps
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    expiresAt: timestamp("expires_at").notNull(),
})

export default scVerification
export type VerificationSchema = typeof scVerification
