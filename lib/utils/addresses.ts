import Cache from "#kernel/cache"
import Base58Encoder from "#kernel/encoders/base58"
import Bech32Encoder from "#kernel/encoders/bech32"
import { AddressType } from "#lib/constants/enums"

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
        return AddressType.EVM // Hex
    }

    return null
}

/**
 * Convert a Bitcoin address to its bytecode.
 * @param address The address to convert.
 * @returns The bytecode of the address.
 */
export function getBitcoinAddressBytecode(address: string, type: AddressType) {
    let encoding: "base58" | "bech32" | null = null

    if (type === AddressType.P2TR || type === AddressType.P2WPKH) {
        encoding = "bech32"
    } else if (type === AddressType.P2PKH || type === AddressType.P2SH_P2WPKH) {
        encoding = "base58"
    }

    if (!encoding) return null
    const cache = new Cache(512)

    if (encoding === "bech32") {
        const bech32Encoder = new Bech32Encoder()
        return bech32Encoder.decode(address, cache)
    } else if (encoding === "base58") {
        const base58Encoder = new Base58Encoder()
        return base58Encoder.decode(address, cache)
    }

    return null
}

/**
 * Convert an EVM (Ethereum Virtual Machine) address to its bytecode.
 * @param address The address to convert.
 * @returns The bytecode of the address.
 */
export function getEVMAddressBytecode(address: `0x${string}`) {
    const bytes = address.slice(2).split("")

    const byteNumbers = new Uint8Array(bytes.length / 2)
    for (let i = 0; i < bytes.length; i += 2) {
        byteNumbers[i / 2] = Number.parseInt(bytes[i] + bytes[i + 1], 16)
    }

    return byteNumbers
}
