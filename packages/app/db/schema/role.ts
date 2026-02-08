import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for user roles.
 */
const scRoles = pgTable("roles", {
    id: text("id").primaryKey(),

    name: text("name").notNull().unique(),
    description: text("description").notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
})

export default scRoles
export type RoleSchema = typeof scRoles
