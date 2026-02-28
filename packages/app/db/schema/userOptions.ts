import scUser from "@app/db/schema/user"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { boolean, pgTable, text } from "drizzle-orm/pg-core"

/**
 * The schema for user options.
 */
const scUserOptions = pgTable("user_options", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    // Worker behavior
    restartUntilAllFound: boolean("restart_until_all_found").notNull(),

    // Automatic address disabling rules
    autoDisableZeroBalance: boolean("auto_disable_zero_balance").notNull(),

    // Relationships
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => scUser.id, { onDelete: "cascade" }),
})

export default scUserOptions
export type UserOptionsSchema = typeof scUserOptions
export type UserOptionsSelectModel = InferSelectModel<typeof scUserOptions>
export type UserOptionsInsertModel = InferInsertModel<typeof scUserOptions>
