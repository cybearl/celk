import errorCodes from "#lib/constants/errors"
import { internalError } from "#lib/utils/internal_responses"
import Role from "#models/role"
import User from "#models/user"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
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
        const adminRole = await Role.findBy("name", "admin")

        if (!adminRole) {
            internalError(errorCodes.MISSING_FIELD_FOR_SEEDING, null, "Admin role not found during user seeding.")
            return
        }

        await users[0].related("roles").attach([adminRole.id as number])
    }
}
