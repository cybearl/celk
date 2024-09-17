/**
 * The different types of addresses that can be created.
 *
 * See https://bitbox.swiss/blog/content/images/2021/10/grafik-1.png for more information.
 */
export enum AddressType {
    P2TR = "BTC::P2TR", // Pay to Taproot
    P2WPKH = "BTC::P2WPKH", // Pay to Witness Public Key Hash (SegWit)
    P2SH_P2WPKH = "BTC::P2SH_P2WPKH", // Pay to Script Hash (Legacy SegWit)
    P2PKH = "BTC::P2PKH", // Pay to Public Key Hash (Legacy)
    EVM = "EVM::EVM", // Ethereum Virtual Machine
}

/**
 * The different modes of jobs that can be created.
 * - `FULL_RANDOM`: Generates the private keys completely randomly in the given range.
 * - `FROM_LOWER_BOUND`: Generates the private keys starting from the lower bound.
 * - `FROM_UPPER_BOUND`: Generates the private keys starting from the upper bound.
 */
export enum JobMode {
    FULL_RANDOM = "full-random",
    FROM_LOWER_BOUND = "from-lower-bound",
    FROM_UPPER_BOUND = "from-upper-bound",
}

/**
 * The different statuses a job can have.
 */
export enum JobStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
}

/**
 * An enum listing all available user roles.
 */
export enum RoleNames {
    ADMIN = "admin",
    USER = "user",
}

/**
 * A list of all available token abilities.
 */
export enum TokenAbility {
    // Unrestricted / all abilities
    UNRESTRICTED = "*",

    // Addresses
    ADDRESS_READ = "address:read",
    ADDRESS_CREATE = "address:create",
    ADDRESS_UPDATE = "address:update",
    ADDRESS_DELETE = "address:delete",
    ADDRESS_LOCK = "address:lock",
    ADDRESS_UNLOCK = "address:unlock",

    // Chains
    CHAIN_READ = "chain:read",

    // Roles
    ROLE_READ = "role:read",

    // Tokens
    TOKEN_READ = "token:read",
    TOKEN_CREATE = "token:create",
    TOKEN_UPDATE = "token:update",
    TOKEN_DELETE = "token:delete",

    // Users
    USER_READ = "user:read",
    USER_CREATE = "user:create",
    USER_UPDATE = "user:update",
    USER_DELETE = "user:delete",
}

/**
 * The scope of a token that can be issued.
 */
export enum TokenScope {
    UNRESTRICTED = "unrestricted",
    API_KEY = "api-key",
    API_SECRET = "api-secret",
}
