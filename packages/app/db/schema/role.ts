import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"

/**
 * The schema for user roles.
 */
const scRoles = pgTable("roles", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),

    name: text("name").notNull().unique(),
    description: text("description").notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scRoles
export type RoleSchema = typeof scRoles
