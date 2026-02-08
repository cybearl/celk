import scRoles from "@app/db/schema/role"
import scUser from "@app/db/schema/user"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"

export const pvtUserRoles = pgTable("user_roles", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv4()),

    userId: text("user_id")
        .notNull()
        .references(() => scUser.id),
    roleId: text("role_id")
        .notNull()
        .references(() => scRoles.id),

    // Timestamps
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
})
