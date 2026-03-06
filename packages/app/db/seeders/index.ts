import seedAddresses from "@app/db/seeders/addresses"
import seedRoles from "@app/db/seeders/roles"

/**
 * An object containing all the seeders for the database.
 */
const seeders: Record<string, () => Promise<void>> = {
    addresses: seedAddresses,
    roles: seedRoles,
}

export default seeders
