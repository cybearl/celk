import Role, { RoleNames } from "#models/role"
import User from "#models/user"
import logger from "@adonisjs/core/services/logger"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        logger.info("seeding users..")

        const users = await User.createMany([
            {
                // Default administrator
                isSeeded: true,
                isLocked: false,
                email: process.env.DEFAULT_ADMIN_EMAIL,
                username: process.env.DEFAULT_ADMIN_USERNAME,
                password: process.env.DEFAULT_ADMIN_PASSWORD,
            },
        ])

        // Link the default administrator to the 'admin' role using the pivot table
        const adminRole = await Role.findBy("name", RoleNames.AdminRole)

        if (!adminRole) {
            logger.error(`role with name ${RoleNames.AdminRole} not found`)
            process.exit(1)
        }

        await users[0].related("roles").attach([adminRole.id as number])
    }
}
