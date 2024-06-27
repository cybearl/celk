import { EtherscanProvider, Networkish, BlockTag } from "ethers" //^v6

/**
 * The type definition of an Ethereum transaction data.
 */
type EthereumAddressTransaction = {
    blockNumber: string
    timeStamp: string
    hash: string
    from: string
    to: string
    value: string
    contractAddress: string
    input: string
    type: string
    gas: string
    gasUsed: string
    traceId: string
    isError: string
    errCode: string
}

/**
 * The type definition of the options for the `getHistory` method.
 */
type GetHistoryOptions = {
    startBlock?: BlockTag
    endBlock?: BlockTag
    sort?: "asc" | "desc"
    page?: number
    offset?: number
}

/**
 * Extends the default Ethers.js provider to add specific functionalities
 * such as fetching the transaction history of an Ethereum address.
 */
export default class EthProvider extends EtherscanProvider {
    constructor(networkish: Networkish, apiKey?: string) {
        super(networkish, apiKey)
    }

    /**
     * Fetches the transaction history of an Ethereum address.
     * @param address The address to get the transactions of.
     * @param options The options for the fetch (optional).
     * - `startBlock`: The block number to start fetching from (optional, default is 0).
     * - `endBlock`: The block number to stop fetching at (optional, default is 99,999,999).
     * - `sort`: The order to sort the transactions in (optional, default is "desc").
     * - `page`: The page number to fetch (optional, default is 1).
     * - `offset`: The number of transactions to fetch per page (optional, default is 10).
     * @returns The fetched address data.
     */
    async getHistory(address: string, options: GetHistoryOptions = {}): Promise<EthereumAddressTransaction[]> {
        const params = {
            action: "txlist",
            address,
            startblock: options.startBlock || 0,
            endblock: options.endBlock || 99_999_999,
            sort: options.sort || "desc",
            page: options.page || 1,
            offset: options.offset || 10,
        }

        return this.fetch("account", params)
    }
}
