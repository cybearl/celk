import seedAddresses from "@app/db/seeders/addresses"
import seedAddressLists from "@app/db/seeders/addressLists"
import seedConfig from "@app/db/seeders/config"
import seedRoles from "@app/db/seeders/roles"

/**
 * An object containing all the seeders for the database.
 */
const seeders: Record<string, () => Promise<void>> = {
    config: seedConfig,
    addresses: seedAddresses,
    addressLists: seedAddressLists,
    roles: seedRoles,
}

export default seeders
