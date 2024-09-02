import { RoleNames } from "#lib/constants/enums"
import Role from "#models/role"
import logger from "@adonisjs/core/services/logger"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        logger.info("seeding roles..")

        await Role.createMany([
            {
                name: RoleNames.AdminRole,
                description: "All permissions are granted to this role.",
            },
            {
                name: RoleNames.UserRole,
                description: "The default role for all users.",
            },
        ])
    }
}
