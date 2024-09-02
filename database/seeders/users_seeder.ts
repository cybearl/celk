import { RoleNames } from "#lib/constants/enums"
import Role from "#models/role"
import User from "#models/user"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        await User.createMany([
            {
                // Default administrator
                isLocked: false,
                email: process.env.DEFAULT_ADMIN_EMAIL,
                username: process.env.DEFAULT_ADMIN_USERNAME,
                password: process.env.DEFAULT_ADMIN_PASSWORD,
                description: "The default administrator.",
            },
        ])

        // Link the default administrator to the 'admin' role using the pivot table
        const admin = await User.findBy("email", process.env.DEFAULT_ADMIN_EMAIL)
        const adminRole = await Role.findBy("name", RoleNames.AdminRole)
        await admin?.related("roles").attach([adminRole?.id as number])
    }
}
