/**
 * The type of a cryptocurrency address.
 */
export type AddressType = "BITCOIN" | "ETHEREUM";

/**
 * Detect if a Bitcoin address is valid (Base58 characters check).
 *
 * Supports for:
 * - P2PKH addresses (1...).
 * - P2SH addresses (3...).
 * - Bech32 addresses (bc1...).
 * @param address The address to validate.
 * @returns Whether the address is valid.
 */
export function isBitcoinAddressValid(address: string): boolean {
    return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
}

/**
 * Detect if an Ethereum address is valid (Hexadecimal characters check + length).
 * @param address The address to validate.
 * @returns Whether the address is valid.
 */
export function isEthereumAddressValid(address: string): boolean {
    if (address.includes("0x")) address = address.slice(2);

    return /^[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Detect if an address is a Bitcoin or an Ethereum one,
 * based on its length.
 * @param address The address to detect.
 * @returns The detected address type.
 */
export function detectAddressType(address: string): AddressType {
    if (isBitcoinAddressValid(address)) return "BITCOIN";
    if (isEthereumAddressValid(address)) return "ETHEREUM";

    throw new Error("detectAddressType: Invalid address length.");
}