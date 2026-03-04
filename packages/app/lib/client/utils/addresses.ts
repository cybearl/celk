import { ADDRESS_NETWORK } from "@app/db/schema/address"

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
