import EthProvider from "#lib/utils/etherscan"
import env from "#start/env"
import { formatEther } from "ethers"

/**
 * The input data of a Bitcoin transaction.
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
 * The output data of a Bitcoin transaction.
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
 * The data of a Bitcoin transaction.
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
 * All the data of a Bitcoin address with its transactions.
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
    const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=${limit}&offset=${offset}`)

    try {
        const data = await response.json()
        return data as BitcoinAddressData
    } catch (error) {
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
export async function getEthereumAddressData(address: string, page = 1, offset = 32) {
    const provider = new EthProvider("homestead", env.get("ETHERSCAN_API"))

    try {
        const balance = Number(formatEther(await provider.getBalance(address)))
        const txCount = await provider.getTransactionCount(address)
        const txs = await provider.getHistory(address, { page, offset })
        return { balance, txCount, txs }
    } catch (error) {
        return null
    }
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
