import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressDump } from "@cybearl/celk-protocol"

/**
 * Builds an inline address dump payload from a list of DB address rows.
 * @param addressListId The ID of the address list the addresses belong to.
 * @param addresses The address rows to convert.
 * @returns An array of address dumps ready to be included in a `StartWorkerMessage`.
 */
export function generateAddressDumps(addressListId: string, addresses: AddressSelectModel[]): AddressDump[] {
    return addresses.map(address => ({
        id: address.id,
        name: address.name,
        network: address.network,
        type: address.type,
        value: address.value,
        preEncoding: address.preEncoding,
        privateKeyGenerator: address.privateKeyGenerator,
        privateKeyRangeStart: address.privateKeyRangeStart ?? null,
        privateKeyRangeEnd: address.privateKeyRangeEnd ?? null,
        addressListId,
    }))
}
