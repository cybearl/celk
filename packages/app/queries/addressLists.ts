import { trpcClient } from "@app/lib/client/connectors/trpcClient"
import { mutate } from "swr"

/**
 * Retrieves all address lists for the current user by sending a query request to the tRPC API.
 * @returns An array of address list objects returned from the API.
 */
export async function getAddressLists() {
    return await trpcClient.addressLists.getAll.query()
}

/**
 * Retrieves only the attempt counts for each address list by sending a query request to the tRPC API.
 * @returns An array of objects containing each address list ID and its current attempts count.
 */
export async function getAddressListAttempts() {
    return await trpcClient.addressLists.getAttempts.query()
}

/**
 * Retrieves all currently enabled address lists for the current user by sending a query
 * request to the tRPC API.
 * @returns An array of enabled address list objects returned from the API.
 */
export async function getEnabledAddressLists() {
    return await trpcClient.addressLists.getEnabled.query()
}

/**
 * Creates a new address list by sending a mutation request to the tRPC API.
 * @param data The data for the new address list, including its name and initial address IDs.
 * @returns The created address list object returned from the API.
 */
export async function createAddressList(data: Parameters<typeof trpcClient.addressLists.create.mutate>[0]) {
    const addressList = await trpcClient.addressLists.create.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "address_lists")
    return addressList
}

/**
 * Retrieves an address list by its ID by sending a query request to the tRPC API.
 * @param id The ID of the address list to retrieve.
 * @returns The address list object (including its member address IDs) returned from the API.
 */
export async function getAddressListById(id: string) {
    return await trpcClient.addressLists.getById.query({ id })
}

/**
 * Deletes an address list by its ID by sending a mutation request to the tRPC API.
 * @param id The ID of the address list to delete.
 */
export async function deleteAddressListById(id: string) {
    await trpcClient.addressLists.deleteById.mutate({ id })
    await mutate(key => Array.isArray(key) && key[0] === "address_lists")
}

/**
 * Adds an address to an address list by sending a mutation request to the tRPC API.
 * @param id The ID of the address list.
 * @param addressId The ID of the address to add.
 * @returns The created membership record returned from the API.
 */
export async function addAddressToList(id: string, addressId: string) {
    const member = await trpcClient.addressLists.addAddress.mutate({ id, addressId })
    await mutate(key => Array.isArray(key) && key[0] === "address_lists")
    return member
}

/**
 * Removes an address from an address list by sending a mutation request to the tRPC API.
 * @param id The ID of the address list.
 * @param addressId The ID of the address to remove.
 */
export async function removeAddressFromList(id: string, addressId: string) {
    await trpcClient.addressLists.removeAddress.mutate({ id, addressId })
    await mutate(key => Array.isArray(key) && key[0] === "address_lists")
}

/**
 * Updates the `stopOnFirstMatch` flag for an address list by sending a mutation request to the tRPC API.
 * @param id The ID of the address list to update.
 * @param stopOnFirstMatch The new value for the `stopOnFirstMatch` flag.
 * @returns The updated address list object returned from the API.
 */
export async function updateAddressListStopOnFirstMatch(id: string, stopOnFirstMatch: boolean) {
    const addressList = await trpcClient.addressLists.updateStopOnFirstMatch.mutate({ id, stopOnFirstMatch })
    await mutate(key => Array.isArray(key) && key[0] === "address_lists")
    return addressList
}

/**
 * Enables an address list by sending a mutation request to the tRPC API.
 * @param id The ID of the address list to enable.
 * @returns The updated address list object returned from the API.
 */
export async function enableAddressList(id: string) {
    const addressList = await trpcClient.addressLists.enable.mutate({ id })
    await mutate(key => Array.isArray(key) && key[0] === "address_lists")
    return addressList
}

/**
 * Disables an address list by sending a mutation request to the tRPC API.
 * @param id The ID of the address list to disable.
 * @returns The updated address list object returned from the API.
 */
export async function disableAddressList(id: string) {
    const addressList = await trpcClient.addressLists.disable.mutate({ id })
    await mutate(key => Array.isArray(key) && key[0] === "address_lists")
    return addressList
}
