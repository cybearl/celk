import EthProvider from "#lib/utils/etherscan"
import env from "#start/env"
import logger from "@adonisjs/core/services/logger"
import { formatEther } from "ethers"

/**
 * The type definition of a Bitcoin transaction input data.
 */
type BitcoinAddressTransactionInput = {
    sequence: number
    witness: string
    script: string
    index: number
    prev_out: {
        spent: boolean
        tx_index: number
        type: number
        addr: string
        value: number
        n: number
        script: string
    }
}

/**
 * The type definition of a Bitcoin transaction output data.
 */
type BitcoinAddressTransactionOutput = {
    spent: boolean
    tx_index: number
    type: number
    addr: string
    value: number
    n: number
    script: string
}

/**
 * The type definition of a Bitcoin transaction data.
 */
type BitcoinAddressTransaction = {
    hash: string
    ver: number
    vin_sz: number
    vout_sz: number
    size: number
    weight: number
    fee: number
    relayed_by: string
    lock_time: number
    tx_index: number
    double_spend: boolean
    time: number
    block_index: number
    block_height: number
    inputs: BitcoinAddressTransactionInput[]
    out: BitcoinAddressTransactionOutput[]
}

/**
 * The type definition of a Bitcoin address with its transactions.
 */
type BitcoinAddressData = {
    hash160: string
    address: string
    n_tx: number
    n_unredeemed: number
    total_received: number
    total_sent: number
    final_balance: number
    txs: BitcoinAddressTransaction[]
}

/**
 * Get all the data of a Bitcoin address with its transactions.
 *
 * **Warning:** This API rate limits requests to 1 requests every 10 seconds.
 * @param address The address to get the transactions of.
 * @param limit The maximum number of transactions to get (optional, default/max is 50).
 * @param offset The number of transactions to skip (optional, default is 0).
 * @returns The fetched address data.
 */
export async function getBitcoinAddressData(address: string, limit = 32, offset = 0) {
    const url = `https://blockchain.info/rawaddr/${address}?limit=${limit}&offset=${offset}`

    try {
        const response = await fetch(url)

        const data = await response.json()
        return data as BitcoinAddressData
    } catch (error) {
        if (`${error}`.toLowerCase().includes("rate")) {
            logger.info(`bitcoin API rate limit reached, skipping..`)
            return null
        }

        logger.error(`bitcoin API returned an error for address '${address}':\n${error}`)
        return null
    }
}

/**
 * Get all the data of an Ethereum address with its transactions.
 * @param address The address to get the transactions of.
 * @param page The page number to fetch (optional, default is 1).
 * @param offset The number of transactions to display per page (optional, default is 32).
 * @returns The fetched address data.
 */
export async function getEthereumAddressData(address: `0x${string}`, page = 1, offset = 32) {
    try {
        const provider = new EthProvider("homestead", env.get("ETHERSCAN_API_KEY"))
        const balance = Number(formatEther(await provider.getBalance(address)))
        const txCount = await provider.getTransactionCount(address)
        const txs = await provider.getHistory(address, { page, offset })

        return { balance, txCount, txs }
    } catch (error) {
        logger.error(`ethereum API returned an error for address '${address}':\n${error}`)
        return null
    }
}
