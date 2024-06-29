import { AddressType } from "#models/address"

/**
 * Get the type of an address.
 * @param address The address to get the type of.
 * @returns The type of the address.
 */
export function getAddressType(address: string): AddressType | null {
    if (address.startsWith("bc1p")) {
        return AddressType.P2TR // Bech32
    } else if (address.startsWith("bc1q")) {
        return AddressType.P2WPKH // Bech32
    } else if (address.startsWith("1")) {
        return AddressType.P2PKH // Base58
    } else if (address.startsWith("3")) {
        return AddressType.P2SH_P2WPKH // Base58
    } else if (address.startsWith("0x")) {
        return AddressType.ETH // Hex
    }

    return null
}

/**
 * Convert an Ethereum address to its bytecode.
 */
export function getEthereumBytecode(address: string) {
    const bytes = address.slice(2).split("")

    const byteNumbers = []
    for (let i = 0; i < bytes.length; i += 2) {
        byteNumbers.push(Number.parseInt(bytes[i] + bytes[i + 1], 16))
    }

    return byteNumbers
}
