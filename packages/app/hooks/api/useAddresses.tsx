import type { AddressSelectModel } from "@app/db/schema/address"
import { getAddressById, getAddresses, getAddressesByListId } from "@app/queries/addresses"
import useSWR from "swr"

/**
 * Retrieves all addresses for the current user by sending a query request to the tRPC API.
 * @param initialData Initial data to use before the first fetch completes (e.g. from SSR).
 * @returns An array of address objects returned from the API, or null if not found.
 */
export function useAddresses(initialData?: AddressSelectModel[] | null) {
    const swr = useSWR(["addresses"], getAddresses, { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}

/**
 * Retrieves all addresses for a specific address list by sending a query request to the tRPC API.
 * @param listId The ID of the address list to retrieve addresses from.
 * @returns An array of address objects returned from the API.
 */
export function useAddressesByListId(listId?: string | null, initialData?: AddressSelectModel[] | null) {
    const key = listId ? ["addresses", "listId", listId] : null
    const swr = useSWR(key, () => getAddressesByListId(listId!), { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}

/**
 * Retrieves an address by its ID by sending a query request to the tRPC API.
 * @param id The ID of the address to retrieve.
 * @param initialData Initial data to use before the first fetch completes (e.g. from SSR).
 * @returns The address object returned from the API, or null if not found.
 */
export function useAddressById(id?: string | null, initialData?: AddressSelectModel | null) {
    const key = id ? ["addresses", "id", id] : null
    const swr = useSWR(key, () => getAddressById(id!), { fallbackData: initialData ?? undefined })
    return { ...swr, data: swr.data ?? null }
}
