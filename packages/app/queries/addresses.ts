import { trpcClient } from "@app/lib/client/connectors/trpcClient"
import { mutate } from "swr"

/**
 * Retrieves all addresses for the current user by sending a query request to the tRPC API.
 * @returns An array of address objects returned from the API.
 */
export async function getAddresses() {
    return await trpcClient.addresses.getAll.query()
}

/**
 * Creates a new address by sending a mutation request to the tRPC API.
 * @param data The data for the new address.
 * @returns The created address object returned from the API.
 */
export async function createAddress(data: Parameters<typeof trpcClient.addresses.create.mutate>[0]) {
    const address = await trpcClient.addresses.create.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "addresses")
    return address
}

/**
 * Retrieves an address by its ID by sending a query request to the tRPC API.
 * @param id The ID of the address to retrieve.
 * @returns The address object returned from the API, or null if not found.
 */
export async function getAddressById(id: string) {
    return await trpcClient.addresses.getById.query({ id })
}

/**
 * Deletes an address by its ID by sending a mutation request to the tRPC API.
 * @param id The ID of the address to delete.
 */
export async function deleteAddressById(id: string) {
    await trpcClient.addresses.deleteById.mutate({ id })
    await mutate(key => Array.isArray(key) && key[0] === "addresses")
}
