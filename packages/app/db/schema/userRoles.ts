import scRoles from "@app/db/schema/role"
import scUser from "@app/db/schema/user"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const scUserRoles = pgTable("user_roles", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    userId: text("user_id")
        .notNull()
        .references(() => scUser.id),
    roleId: text("role_id")
        .notNull()
        .references(() => scRoles.id),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export default scUserRoles
export type UserRolesSchema = typeof scUserRoles
export type UserRolesSelectModel = InferSelectModel<typeof scUserRoles>
export type UserRolesInsertModel = InferInsertModel<typeof scUserRoles>
