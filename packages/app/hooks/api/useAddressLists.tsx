import type { AddressListSelectModel } from "@app/db/schema/addressList"
import { getAddressListById, getAddressLists, getEnabledAddressLists } from "@app/queries/addressLists"
import useSWR from "swr"

/**
 * Retrieves all address lists for the current user by sending a query request to the tRPC API.
 * @param initialData Initial data to use before the first fetch completes (e.g. from SSR).
 * @returns An array of address list objects returned from the API, or null if not found.
 */
export function useAddressLists(initialData?: AddressListSelectModel[] | null) {
    const swr = useSWR(["address_lists"], getAddressLists, { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}

/**
 * Retrieves all currently enabled address lists for the current user by sending a query
 * request to the tRPC API.
 * @param initialData Initial data to use before the first fetch completes (e.g. from SSR).
 * @returns An array of enabled address list objects returned from the API, or null if not found.
 */
export function useEnabledAddressLists(initialData?: AddressListSelectModel[] | null) {
    const swr = useSWR(["address_lists", "enabled"], getEnabledAddressLists, { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}

/**
 * Retrieves an address list by its ID by sending a query request to the tRPC API.
 * @param id The ID of the address list to retrieve.
 * @param initialData Initial data to use before the first fetch completes (e.g. from SSR).
 * @returns The address list object (including its member address IDs) returned from the API, or null if not found.
 */
export function useAddressListById(
    id?: string | null,
    initialData?: Awaited<ReturnType<typeof getAddressListById>> | null,
) {
    const key = id ? ["address_lists", "id", id] : null
    const swr = useSWR(key, () => getAddressListById(id!), { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}
