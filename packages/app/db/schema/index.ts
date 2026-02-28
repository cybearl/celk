import scAccount from "@app/db/schema/account"
import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scSession from "@app/db/schema/session"
import scUser from "@app/db/schema/user"
import scUserOptions from "@app/db/schema/userOptions"
import scVerification from "@app/db/schema/verification"

/**
 * The database schema for the application.
 *
 * Note: Keys here should match table names.
 */
const schema = {
    users: scUser,
    accounts: scAccount,
    sessions: scSession,
    verifications: scVerification,
    addresses: scAddress,
    address_lists: scAddressList,
    address_list_members: scPvtAddressListMember,
    user_options: scUserOptions,
}

export default schema
