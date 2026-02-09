import schema from "@app/db/schema"
import { db } from "@app/lib/connectors/db"

export default async function seedUsers() {
    const a = await db
        .insert(schema.users)
        .values([
            {
                username: "",
                displayUsername: "",
                name: "",
                email: "",
            },
        ])
        .returning({ id: schema.users.id })
}
