import { ADDRESS_NETWORK, type AddressSelectModel } from "@app/db/schema/address"

/**
 * Convert a numeric representing an Eth-based value in `GWei` to a human-readable format in `ether`.
 * @param gWeiValue The GWei value to convert (as a numeric).
 * @param decimalPlaces The number of decimal places to include in the formatted output (optional, defaults to 2).
 * @returns The converted ether value as a string.
 */
export function formatGWeiToEther(gWeiValue: string, decimalPlaces = 2): string {
    const etherValue = parseFloat(gWeiValue) / 1e9
    return etherValue.toLocaleString("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    })
}

/**
 * Convert a numeric representing a Bitcoin-based value in `satoshis` to a human-readable format in `bitcoin`.
 * @param satoshiValue The satoshi value to convert (as a numeric).
 * @param decimalPlaces The number of decimal places to include in the formatted output (optional, defaults to 2).
 * @returns The converted bitcoin value as a string.
 */
export function formatSatoshisToBitcoin(satoshiValue: string, decimalPlaces = 2): string {
    const bitcoinValue = parseFloat(satoshiValue) / 1e8
    return bitcoinValue.toLocaleString("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    })
}

/**
 * Get the raw unit of the balance of an address based on its network (GWei/satoshis).
 * @param address The address to get the balance unit for.
 * @returns The raw unit of the balance as a string.
 */
export function getRawAddressBalanceUnit(address: AddressSelectModel): string {
    switch (address.network) {
        case ADDRESS_NETWORK.ETHEREUM:
        case ADDRESS_NETWORK.BSC:
        case ADDRESS_NETWORK.POLYGON:
            return "GWei"
        case ADDRESS_NETWORK.BITCOIN:
            return "Satoshi(s)"
        default:
            return "N/A"
    }
}

/**
 * Get the unit of the balance of an address based on its network.
 * @param address The address to get the balance unit for.
 * @returns The unit of the balance as a string.
 */
export function getAddressBalanceUnit(address: AddressSelectModel): string {
    switch (address.network) {
        case ADDRESS_NETWORK.ETHEREUM:
            return "ETH"
        case ADDRESS_NETWORK.BSC:
            return "BNB"
        case ADDRESS_NETWORK.POLYGON:
            return "POL"
        case ADDRESS_NETWORK.BITCOIN:
            return "BTC"
        default:
            return "N/A"
    }
}

/**
 * Formats the raw balance of an address (GWei/satoshis).
 * @param address The address to format the balance for.
 * @returns The formatted raw balance as a string.
 */
export function formatRawAddressBalance(address: AddressSelectModel): string {
    if (!address.balance) return "N/A"

    const unit = ` ${getRawAddressBalanceUnit(address)}`

    switch (address.network) {
        case ADDRESS_NETWORK.ETHEREUM:
        case ADDRESS_NETWORK.BSC:
        case ADDRESS_NETWORK.POLYGON:
            return BigInt(address.balance).toLocaleString("en-US") + unit
        case ADDRESS_NETWORK.BITCOIN:
            return BigInt(address.balance).toLocaleString("en-US") + unit
        default:
            return "N/A"
    }
}

/**
 * Takes in an address, and returns a formatted version of its balance depending on its network.
 *
 * Note: For Ethereum and similar networks, the balance is passed in GWei.
 * @param address The address to format the balance for.
 * @returns The formatted balance as a string.
 */
export function formatAddressBalance(address: AddressSelectModel): string {
    if (!address.balance) return "N/A"

    const unit = ` ${getAddressBalanceUnit(address)}`

    switch (address.network) {
        case ADDRESS_NETWORK.ETHEREUM:
        case ADDRESS_NETWORK.BSC:
        case ADDRESS_NETWORK.POLYGON:
            return formatGWeiToEther(address.balance) + unit
        case ADDRESS_NETWORK.BITCOIN:
            return formatSatoshisToBitcoin(address.balance) + unit
        default:
            return "N/A"
    }
}
