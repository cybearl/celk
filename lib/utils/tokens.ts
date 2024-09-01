import User from "#models/user"

/**
 * The scope of a token that can be issued.
 */
export enum TokenScope {
    UNRESTRICTED = "unrestricted",
    API_KEY = "api-key",
    API_SECRET = "api-secret",
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
 * A record of token scopes and their abilities.
 */
export const TokenScopeAbilities: Record<TokenScope, TokenAbility[]> = {
    [TokenScope.UNRESTRICTED]: [TokenAbility.UNRESTRICTED],
    [TokenScope.API_KEY]: [],
    [TokenScope.API_SECRET]: [],
}

/**
 * Check if a user's token has a specific ability.
 * @param user The user to check.
 * @param ability The ability to check for.
 * @returns Whether the user has the ability.
 */
export function userTokenHasAbility(user: User, ability: TokenAbility): boolean {
    return user.currentAccessToken?.abilities.includes(ability) || false
}

/**
 * Recover the scope of a token based on its abilities.
 * @param abilities The abilities of the token.
 * @returns The scope of the token.
 */
export function recoverTokenScope(abilities: string[]): TokenScope {
    for (const [scope, scopeAbilities] of Object.entries(TokenScopeAbilities)) {
        if (scopeAbilities.every((ability) => abilities.includes(ability))) return scope as TokenScope
    }

    return TokenScope.UNRESTRICTED
}
