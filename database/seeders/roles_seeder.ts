import { RoleNames } from "#lib/constants/enums"
import Role from "#models/role"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        await Role.createMany([
            {
                name: RoleNames.ADMIN,
                description: "All permissions are granted to this role.",
            },
            {
                name: RoleNames.USER,
                description: "The default role for all users.",
            },
        ])
    }
}
