import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for user account verifications.
 */
const scVerification = pgTable("verifications", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    identifier: text("identifier").notNull(),
    value: text("value").notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
})

export default scVerification
export type VerificationSchema = typeof scVerification
export type VerificationSelectModel = InferSelectModel<typeof scVerification>
export type VerificationInsertModel = InferInsertModel<typeof scVerification>
