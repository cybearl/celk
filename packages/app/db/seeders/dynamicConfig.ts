import DYNAMIC_CONFIG from "@app/config/dynamicConfig"
import scDynamicConfig from "@app/db/schema/dynamicConfig"
import { db } from "@app/lib/server/connectors/db"

/**
 * Seed the default dynamic application config into the database.
 */
export default async function seedDynamicConfig() {
    await db.insert(scDynamicConfig).values(DYNAMIC_CONFIG).onConflictDoNothing()
}
