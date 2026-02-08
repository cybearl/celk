import scAccount from "@app/db/schema/account"
import scSession from "@app/db/schema/session"
import scUser from "@app/db/schema/user"
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
}

export default schema
