import scRoles from "@app/db/schema/role"
import scUser from "@app/db/schema/user"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const pvtUserRoles = pgTable("pvt_user_roles", {
    id: text("id").primaryKey(),

    userId: integer("user_id")
        .notNull()
        .references(() => scUser.id),
    roleId: integer("role_id")
        .notNull()
        .references(() => scRoles.id),

    // Timestamps
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
})
