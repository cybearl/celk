import { AddressType } from "#models/address"

/**
 * Get the type of an address.
 * @param address The address to get the type of.
 * @returns The type of the address.
 */
export function getAddressType(address: string): AddressType | null {
    if (address.startsWith("bc1p")) {
        return AddressType.P2TR
    } else if (address.startsWith("bc1q")) {
        return AddressType.P2WPKH
    } else if (address.startsWith("3")) {
        return AddressType.P2SH_P2WPKH
    } else if (address.startsWith("1")) {
        return AddressType.P2PKH
    } else if (address.startsWith("0x")) {
        return AddressType.ETH
    }

    return null
}
