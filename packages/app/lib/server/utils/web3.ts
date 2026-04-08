import WEB3_CONFIG from "@app/config/web3"
import { ADDRESS_NETWORK, type AddressSelectModel } from "@app/db/schema/address"
import type { LoggerInstance } from "@app/lib/base/utils/logger"
import { jsonRpcProviders } from "@app/lib/server/connectors/web3"

/**
 * Fetches the balance **in GWei** of any Ethereum-compatible address based on its network.
 * @param address The address to fetch the balance for.
 * @param logger The Web3-related logger.
 * @returns The balance (as a numeric) of the address or null if the call fails
 */
export async function getEthCompatibleAddressBalance(address: AddressSelectModel, logger: LoggerInstance) {
    const provider = jsonRpcProviders[address.network]

    if (!provider) {
        logger.error(`No JSON-RPC provider available for network: ${address.network}`)
        return null
    }

    try {
        const balance = await provider.getBalance(address.value)
        return (balance / 1_000_000_000n).toString()
    } catch (error) {
        logger.error(`An error occurred while fetching Ethereum-compatible address balance for '${address.value}':`, {
            data: error,
        })

        return null
    }
}

/**
 * Fetches the balance **in satoshis** of a Bitcoin address via Mempool.space.
 * @param address The Bitcoin address to fetch the balance for.
 * @param logger The Web3-related logger.
 * @returns The balance (as a numeric) of the address or null if the fetch fails.
 */
export async function getBitcoinAddressBalance(address: AddressSelectModel, logger: LoggerInstance) {
    const url = `${WEB3_CONFIG.urls[ADDRESS_NETWORK.BITCOIN].addressEndpoint}/${address.value}`

    try {
        const response = await fetch(url)

        let data: any
        if (response.ok) {
            data = await response.json()
        } else {
            logger.error(`Failed to fetch Bitcoin address balance for '${address.value}', status: ${response.status}`)
            return null
        }

        if (
            typeof data.chain_stats?.funded_txo_sum === "number" &&
            typeof data.chain_stats?.spent_txo_sum === "number"
        ) {
            return (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum).toString()
        } else {
            logger.error(`Invalid data structure for Bitcoin address balance:`, { data })
        }
    } catch (error) {
        logger.error(`An error occurred while fetching Bitcoin address balance for '${address.value}':`, {
            data: error,
        })
    }

    return null
}
