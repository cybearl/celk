import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import { getDynamicConfig } from "@app/queries/dynamicConfig"
import useSWR from "swr"

/**
 * Retrieves the dynamic application config by sending a query request to the tRPC API.
 * @param initialData Initial data to use before the first fetch completes (e.g., from SSR).
 * @returns The dynamic application config object returned from the API, or null if not found.
 */
export function useDynamicConfig(initialData?: DynamicConfigSelectModel | null) {
    const swr = useSWR(["config"], getDynamicConfig, { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}
