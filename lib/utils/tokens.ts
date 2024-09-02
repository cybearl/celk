import { TokenAbility, TokenScope } from "#lib/constants/enums"
import User from "#models/user"

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
