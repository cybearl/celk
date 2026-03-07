import type { ConfigSelectModel } from "@app/db/schema/config"
import { getConfig } from "@app/queries/config"
import useSWR from "swr"

/**
 * Retrieves the application config by sending a query request to the tRPC API.
 * @param initialData Initial data to use before the first fetch completes (e.g. from SSR).
 * @returns The config object returned from the API, or null if not found.
 */
export function useConfig(initialData?: ConfigSelectModel | null) {
    const swr = useSWR(["config"], getConfig, { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}
