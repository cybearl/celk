import schema from "@app/db/schema"
import { db } from "@app/lib/connectors/db"

export default async function seed() {
    await db.insert(schema.users).values([{}])
}
