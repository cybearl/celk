import {
    ADDRESS_NETWORK,
    ADDRESS_TYPE,
    type AddressSelectModel,
    WORKER_PRIVATE_KEY_GENERATOR,
} from "@app/db/schema/address"
import { sha256 } from "@noble/hashes/sha2.js"
import { base58, bech32, bech32m, createBase58check } from "@scure/base"

/**
 * An instance of `Base58Check` for Bitcoin addresses.
 */
const base58check = createBase58check(sha256)

/**
 * Get a formatted version of the network of an address for display purposes.
 * @param network The network of the address.
 * @returns A formatted version of the network of the address.
 */
export function getFormattedAddressNetwork(network: ADDRESS_NETWORK) {
    switch (network) {
        case ADDRESS_NETWORK.BITCOIN:
            return "Bitcoin"
        case ADDRESS_NETWORK.ETHEREUM:
            return "Ethereum"
        case ADDRESS_NETWORK.POLYGON:
            return "Polygon"
        default:
            return network
    }
}

/**
 * Get a formatted version of the type of an address for display purposes.
 * @param type The type of the address.
 * @return A formatted version of the type of the address.
 */
export function getFormattedAddressType(type: ADDRESS_TYPE) {
    switch (type) {
        case ADDRESS_TYPE.ETHEREUM:
            return "ETH"
        case ADDRESS_TYPE.BTC_P2PKH:
            return "BTC P2PKH"
        case ADDRESS_TYPE.BTC_P2WPKH:
            return "BTC P2WPKH"
        case ADDRESS_TYPE.BTC_P2SH:
            return "BTC P2SH"
        case ADDRESS_TYPE.BTC_P2TR:
            return "BTC P2TR"
        default:
            return type
    }
}

/**
 * Get the compatible types for a given network.
 * @param network The network to get the compatible types for.
 * @returns The compatible types as an array of `ADDRESS_TYPE`.
 */
export function getCompatibleAddressTypes(network: ADDRESS_NETWORK): ADDRESS_TYPE[] {
    switch (network) {
        case ADDRESS_NETWORK.BITCOIN:
            return [ADDRESS_TYPE.BTC_P2PKH, ADDRESS_TYPE.BTC_P2WPKH, ADDRESS_TYPE.BTC_P2SH, ADDRESS_TYPE.BTC_P2TR]
        case ADDRESS_NETWORK.ETHEREUM:
        case ADDRESS_NETWORK.POLYGON:
            return [ADDRESS_TYPE.ETHEREUM]
        default:
            return []
    }
}

/**
 * Get the prefix of an address based on its value or type.
 * @param address The address to get the prefix for (optional, required if `type` is not provided).
 * @param type The type of the address (optional, required if `address` is not provided).
 * @returns The prefix of the address or null if neither is provided / invalid.
 */
export function getAddressPrefix({ address, type }: { address?: string; type?: ADDRESS_TYPE }): string | null {
    if (!address && !type) return null

    if (address) {
        const type = getAddressType(address)
        if (type) return getAddressPrefix({ type })
        else return null
    } else {
        switch (type) {
            case ADDRESS_TYPE.ETHEREUM:
                return "0x"
            case ADDRESS_TYPE.BTC_P2PKH:
                return "1"
            case ADDRESS_TYPE.BTC_P2WPKH:
                return "bc1q"
            case ADDRESS_TYPE.BTC_P2SH:
                return "3"
            case ADDRESS_TYPE.BTC_P2TR:
                return "bc1p"
            default:
                return null
        }
    }
}

/**
 * Get the type of an address depending on its prefix.
 * @param address The address to get the type for.
 * @returns The type of the address, or null if the format is unrecognized.
 */
export function getAddressType(address: string): ADDRESS_TYPE | null {
    if (address.startsWith("0x")) return ADDRESS_TYPE.ETHEREUM
    if (address.startsWith("1")) return ADDRESS_TYPE.BTC_P2PKH
    if (address.startsWith("bc1q")) return ADDRESS_TYPE.BTC_P2WPKH
    if (address.startsWith("3")) return ADDRESS_TYPE.BTC_P2SH
    if (address.startsWith("bc1p")) return ADDRESS_TYPE.BTC_P2TR
    return null
}

/**
 * Get the URL to the explorer for a given address on a given network.
 * @param address The address to get the explorer URL for.
 * @param network The network of the address.
 * @returns The URL to the explorer for the given address on the given network.
 */
export function getAddressExplorerUrl(address: string, network: ADDRESS_NETWORK) {
    switch (network) {
        case ADDRESS_NETWORK.BITCOIN:
            return `https://www.blockchain.com/explorer/addresses/btc/${address}`
        case ADDRESS_NETWORK.ETHEREUM:
            return `https://etherscan.io/address/${address}`
        case ADDRESS_NETWORK.POLYGON:
            return `https://polygonscan.com/address/${address}`
        default:
            return null
    }
}

/**
 * Converts a hex string (with or without "0x" prefix) to a `Uint8Array` of bytes.
 * @param hexAddress The hex string to convert.
 * @return A `Uint8Array` containing the bytes represented by the hex string.
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
 * Lookup table for fast byte-to-hex conversion (indices 0-255 → "00"-"ff").
 */
const HEX_LOOKUP = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"))

/**
 * Converts a `Uint8Array` of bytes to a lowercase hex string (no "0x" prefix).
 * Uses a precomputed lookup table to avoid per-byte `toString(16)` + padding overhead.
 * @param bytes The bytes to convert.
 * @returns A lowercase hex string.
 */
export function convertBytesToHexAddress(bytes: Uint8Array): string {
    let result = ""
    for (let i = 0; i < bytes.length; i++) result += HEX_LOOKUP[bytes[i]]
    return result
}

/**
 * Converts a Bitcoin or Ethereum address into a `Uint8Array` of bytes.
 * @param address The address to convert.
 * @returns A `Uint8Array` containing the bytes represented by the address, or
 * its pre-encoded form if available, and null if the format is unrecognized.
 */
export function convertAddressToBytes(address: AddressSelectModel): Uint8Array | null {
    // Prefer pre-encoding (raw bytes before Base58/encoding)
    if (address.preEncoding) return convertHexAddressToBytes(address.preEncoding)

    // Fallback to Ethereum hex format
    if (/^0x[0-9a-f]*/i.test(address.value)) return convertHexAddressToBytes(address.value)

    return null
}

/**
 * Decodes the payload of a Base58Check-encoded string.
 * @param value The Base58Check-encoded string to decode.
 * @returns The decoded payload as a `Uint8Array`, or null if the input is invalid.
 */
function decodeBase58CheckPayload(value: string): Uint8Array | null {
    try {
        const buf = base58.decode(value)
        const payload = buf.slice(0, -4)
        const checksum = buf.slice(-4)
        const expected = sha256(sha256(payload)).slice(0, 4)

        for (let i = 0; i < 4; i++) {
            if (checksum[i] !== expected[i]) return null
        }

        return payload
    } catch {
        return null
    }
}

/**
 * Validates that a crypto address is structurally correct and passes its checksum.
 * @param type The type of the address (e.g., Ethereum, Bitcoin P2PKH, Bitcoin P2WPKH).
 * @param value The address string to validate.
 * @return True if the address is valid, false otherwise.
 */
export function isValidCryptoAddress(type: ADDRESS_TYPE, value: string): boolean {
    switch (type) {
        case ADDRESS_TYPE.ETHEREUM:
            return /^0x[0-9a-fA-F]{40}$/.test(value)
        case ADDRESS_TYPE.BTC_P2PKH: {
            const payload = decodeBase58CheckPayload(value)
            return payload !== null && payload[0] === 0x00 && payload.length === 21
        }
        case ADDRESS_TYPE.BTC_P2WPKH: {
            try {
                const { prefix, words } = bech32.decode(value as `${string}1${string}`)
                const witnessProgram = bech32.fromWords(words.slice(1))

                // Witness version 0, mainnet prefix "bc", 20-byte program
                return prefix === "bc" && words[0] === 0 && witnessProgram.length === 20
            } catch {
                return false
            }
        }
        case ADDRESS_TYPE.BTC_P2SH: {
            const payload = decodeBase58CheckPayload(value)
            return payload !== null && payload[0] === 0x05 && payload.length === 21
        }
        case ADDRESS_TYPE.BTC_P2TR: {
            try {
                const { prefix, words } = bech32m.decode(value as `${string}1${string}`)
                const witnessProgram = bech32m.fromWords(words.slice(1))

                // Witness version 1, mainnet prefix "bc", 32-byte x-only pubkey
                return prefix === "bc" && words[0] === 1 && witnessProgram.length === 32
            } catch {
                return false
            }
        }
    }

    return false
}

/**
 * Decodes a Bitcoin address to get its "pre-encoding" version,
 * by taking its type into account.
 * @param address The address to decode.
 * @returns The decoded address bytes, or null if the format is unrecognized.
 */
export function decodeBitcoinAddress(address: string): Uint8Array | null {
    const type = getAddressType(address)
    if (!type) return null

    switch (type) {
        case ADDRESS_TYPE.BTC_P2PKH:
        case ADDRESS_TYPE.BTC_P2SH: {
            try {
                // 1 byte version + 20 bytes "hash160"
                const decoded = base58check.decode(address)
                return decoded.slice(1) // strip version byte, keep 20-byte hash
            } catch {
                return null
            }
        }

        case ADDRESS_TYPE.BTC_P2WPKH: {
            try {
                const { words } = bech32.decode(address as `${string}1${string}`)
                // Slicing off witness version (0)
                return new Uint8Array(bech32.fromWords(words.slice(1))) // 20 bytes
            } catch {
                return null
            }
        }

        case ADDRESS_TYPE.BTC_P2TR: {
            try {
                const { words } = bech32m.decode(address as `${string}1${string}`)
                // Slicing off witness version (1)
                return new Uint8Array(bech32m.fromWords(words.slice(1))) // 32 bytes
            } catch {
                return null
            }
        }

        default:
            return null
    }
}

/**
 * Get the displayable label for a private key generator, based on its internal enum value.
 * @param generator The private key generator to get the label for.
 * @returns The displayable label for the private key generator.
 */
export function getPrivateKeyGeneratorLabel(generator: WORKER_PRIVATE_KEY_GENERATOR) {
    switch (generator) {
        case WORKER_PRIVATE_KEY_GENERATOR.RandBytes:
            return "Random Bytes"
        case WORKER_PRIVATE_KEY_GENERATOR.PCG64:
            return "PCG64"
        case WORKER_PRIVATE_KEY_GENERATOR.Sequential:
            return "Sequential"
        default:
            return generator
    }
}
