import { ADDRESS_NETWORK, type AddressSelectModel } from "@app/db/schema/address"

/**
 * Get the URL to the explorer for a given address on a given network.
 * @param address The address to get the explorer URL for.
 * @param network The network of the address.
 * @returns The URL to the explorer for the given address on the given network.
 */
export function getAddressExplorerUrl(address: string, network: ADDRESS_NETWORK) {
    switch (network) {
        case ADDRESS_NETWORK.BITCOIN:
            return `https://www.blockchain.com/btc/address/${address}`
        case ADDRESS_NETWORK.ETHEREUM:
            return `https://etherscan.io/address/${address}`
        case ADDRESS_NETWORK.POLYGON:
            return `https://polygonscan.com/address/${address}`
        default:
            return null
    }
}

/**
 * Converts a hex string (with or without "0x" prefix) to a Uint8Array of bytes.
 * @param hexAddress The hex string to convert.
 * @return A Uint8Array containing the bytes represented by the hex string.
 */
export function convertHexAddressToBytes(hexAddress: string): Uint8Array {
    // Remove "0x" prefix and whitespace
    const strippedHexAddress = hexAddress.replace(/^0x/i, "").replace(/\s+/g, "")
    if (!strippedHexAddress.length) return new Uint8Array(0)

    // Pad with leading zero if the length is odd
    const paddedHexAddress = strippedHexAddress.length % 2 ? `0${strippedHexAddress}` : strippedHexAddress

    const outputUint8Array = new Uint8Array(paddedHexAddress.length / 2)

    for (let i = 0; i < outputUint8Array.length; i++) {
        outputUint8Array[i] = parseInt(paddedHexAddress.slice(i * 2, i * 2 + 2), 16)
    }

    return outputUint8Array
}

/**
 * Converts a Bitcoin or Ethereum address to a Uint8Array of bytes.
 * @param address The address to convert.
 * @returns A Uint8Array containing the bytes represented by the address,
 * or null if the format is unrecognized.
 */
export function convertAddressToBytes(address: AddressSelectModel): Uint8Array | null {
    // Prefer pre-encoding (raw bytes before Base58/encoding)
    if (address.preEncoding) return convertHexAddressToBytes(address.preEncoding)

    // Fallback to Ethereum hex format
    if (/^0x[0-9a-f]*/i.test(address.value)) return convertHexAddressToBytes(address.value)

    return null
}
