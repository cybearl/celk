import DYNAMIC_CONFIG from "@app/config/dynamicConfig"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"

/**
 * Computes the next retry delay for the workers manager using exponential backoff, capped at the configured maximum.
 * @param dynamicConfig The dynamic application config object.
 * @param retryCount The current retry attempt count.
 * @returns The delay in milliseconds before the next retry attempt.
 */
export function getWorkersManagerRetryDelay(dynamicConfig: DynamicConfigSelectModel | null, retryCount: number) {
    const base = dynamicConfig?.workersManagerSyncRetryBaseDelayMs ?? DYNAMIC_CONFIG.workersManagerSyncRetryBaseDelayMs
    const max = dynamicConfig?.workersManagerSyncRetryMaxDelayMs ?? DYNAMIC_CONFIG.workersManagerSyncRetryMaxDelayMs

    return Math.min(base * 2 ** (retryCount - 1), max)
}

/**
 * Computes the next retry delay for the balance checker using exponential backoff, capped at the configured maximum.
 * @param dynamicConfig The dynamic application config object.
 * @param retryCount The current retry attempt count.
 * @returns The delay in milliseconds before the next retry attempt.
 */
export function getBalanceCheckerRetryDelay(dynamicConfig: DynamicConfigSelectModel | null, retryCount: number) {
    const base = dynamicConfig?.balanceCheckerRetryBaseDelayMs ?? DYNAMIC_CONFIG.balanceCheckerRetryBaseDelayMs
    const max = dynamicConfig?.balanceCheckerRetryMaxDelayMs ?? DYNAMIC_CONFIG.balanceCheckerRetryMaxDelayMs

    return Math.min(base * 2 ** (retryCount - 1), max)
}
