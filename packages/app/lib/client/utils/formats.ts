import { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"

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
        default:
            return type
    }
}
