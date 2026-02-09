import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * The schema for user roles.
 */
const scRoles = pgTable("roles", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    name: text("name").notNull().unique(),
    description: text("description").notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scRoles
export type RoleSchema = typeof scRoles
