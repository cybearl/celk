import WORKERS_CONFIG from "@app/config/workers"
import type { ConfigSelectModel } from "@app/db/schema/config"

/**
 * Computes the next retry delay using exponential backoff,
 * capped at the configured maximum.
 * @param config The application config object.
 * @param retryCount The current retry attempt count.
 * @returns The delay in milliseconds before the next retry attempt.
 */
export function getRetryDelay(config: ConfigSelectModel | null, retryCount: number) {
    const base = config?.syncRetryBaseDelayMs ?? WORKERS_CONFIG.syncRetry.baseDelayMs
    const max = config?.syncRetryMaxDelayMs ?? WORKERS_CONFIG.syncRetry.maxDelayMs
    return Math.min(base * 2 ** (retryCount - 1), max)
}
