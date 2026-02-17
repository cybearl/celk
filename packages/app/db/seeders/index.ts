import seedRoles from "@app/db/seeders/roles"

/**
 * An object containing all the seeders for the database.
 */
const seeders: Record<string, () => Promise<void>> = {
    roles: seedRoles,
}

export default seeders
