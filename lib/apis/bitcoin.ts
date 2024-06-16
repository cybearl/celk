/**
 * The base url for the Bitcoin API.
 */
const baseUrl = "https://blockchain.info/"

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
 * @param address The address to get the transactions of.
 * @param limit The maximum number of transactions to get (optional, default/max is 50).
 * @param offset The number of transactions to skip (optional, default is 0).
 */
export async function getBitcoinAddressData(address: string, limit = 50, offset = 0) {
    const response = await fetch(`${baseUrl}rawaddr/${address}?limit=${limit}&offset=${offset}`)

    const data = await response.json()
    return data as BitcoinAddressData
}
