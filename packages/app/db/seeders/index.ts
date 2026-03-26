import seedAddresses from "@app/db/seeders/addresses"
import seedAddressLists from "@app/db/seeders/addressLists"
import seedDynamicConfig from "@app/db/seeders/dynamicConfig"
import seedRoles from "@app/db/seeders/roles"

/**
 * An object containing all the seeders for the database.
 */
const seeders: Record<string, () => Promise<void>> = {
    dynamicConfig: seedDynamicConfig,
    addresses: seedAddresses,
    addressLists: seedAddressLists,
    roles: seedRoles,
}

export default seeders
