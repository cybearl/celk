import type { UserOptionsSelectModel } from "@app/db/schema/userOptions"
import { getUserOptions } from "@app/queries/users"
import useSWR from "swr"

/**
 * Retrieve the current user's options by sending a query request to the tRPC API.
 * @param initialData Initial data to use before the first fetch completes (e.g., from SSR).
 * @returns The user options object returned from the API, or null if not yet created.
 */
export function useUserOptions(initialData?: UserOptionsSelectModel | null) {
    const swr = useSWR(["user-options"], getUserOptions, { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}
