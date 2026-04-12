import { trpcClient } from "@app/lib/client/connectors/trpcClient"
import { mutate } from "swr"

/**
 * Retrieves all addresses for the current user by sending a query request to the tRPC API.
 * @returns An array of address records returned from the API.
 */
export async function getAddresses() {
    return await trpcClient.addresses.getAll.query()
}

/**
 * Retrieves only the balances for each address belonging to the current user,
 * also fetches the last checked date for each balance for display purposes,
 * by sending a query request to the tRPC API.
 * @returns An array of objects containing each address ID, its current balance
 * and the last checked date for each balance.
 */
export async function getAddressBalances() {
    return await trpcClient.addresses.getBalances.query()
}

/**
 * Retrieves live worker-updated stats for each address by sending a query request to the tRPC API.
 * @returns An array of objects containing each address ID, its current attempts count,
 * its closest match score, and its encrypted private key (null if not yet found).
 */
export async function getAddressLiveStats() {
    return await trpcClient.addresses.getLiveStats.query()
}

/**
 * Retrieves all addresses for a specific address list by sending a query request to the tRPC API.
 * @param listId The ID of the address list to retrieve addresses from.
 * @returns An array of address records returned from the API.
 */
export async function getAddressesByListId(listId: string) {
    return await trpcClient.addresses.getByListId.query({ listId })
}

/**
 * Creates a new address by sending a mutation request to the tRPC API.
 * @param data The data for the new address.
 * @returns The created address returned from the API.
 */
export async function createAddress(data: Parameters<typeof trpcClient.addresses.create.mutate>[0]) {
    const address = await trpcClient.addresses.create.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "addresses")
    return address
}

/**
 * Retrieves an address by its ID by sending a query request to the tRPC API.
 * @param id The ID of the address to retrieve.
 * @returns The address returned from the API, or null if not found.
 */
export async function getAddressById(id: string) {
    return await trpcClient.addresses.getById.query({ id })
}

/**
 * Updates the `isDisabled` flag for an address by sending a mutation request to the tRPC API.
 * @param id The ID of the address to update.
 * @param isDisabled The new value for the `isDisabled` flag.
 * @returns The updated address returned from the API.
 */
export async function updateAddressIsDisabled(id: string, isDisabled: boolean) {
    return await trpcClient.addresses.updateIsDisabled.mutate({ id, isDisabled })
}

/**
 * Decrypts and retrieves the plaintext private key for a given address.
 * @param id The ID of the address whose private key to decrypt.
 * @returns An object containing the plaintext private key.
 */
export async function decryptAddressPrivateKey(id: string) {
    return await trpcClient.addresses.decryptPrivateKey.query({ id })
}

/**
 * Deletes an address by its ID by sending a mutation request to the tRPC API.
 * @param id The ID of the address to delete.
 */
export async function deleteAddressById(id: string) {
    await trpcClient.addresses.deleteById.mutate({ id })
    await mutate(key => Array.isArray(key) && key[0] === "addresses")
}
