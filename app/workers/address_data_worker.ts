import addressDataConfig from "#config/address_data"
import workersConfig from "#config/workers"
import { getBitcoinAddressData, getEthereumAddressData } from "#lib/apis/web3"
import Address from "#models/address"
import { addressDataQueue } from "#queues/index"
import logger from "@adonisjs/core/services/logger"
import { Worker } from "bullmq"
import { DateTime } from "luxon"

/**
 * Fetch the data of a Bitcoin address.
 * @param address The address to fetch the data of.
 */
export async function fetchBitcoinAddressData(address: Address) {
    const addressData = await getBitcoinAddressData(address.hash)
    if (!addressData) return false

    // TODO: Bytecode
    address.bytecode = new Uint8Array([0, 1, 2])
    address.balance = addressData.final_balance / 1e8
    address.txCount = addressData.n_tx
    address.lastUsedAt = DateTime.fromSeconds(addressData.txs[0].time)

    return true
}

/**
 * Fetch the data of an Ethereum address.
 * @param address The address to fetch the data of.
 */
export async function fetchEthereumAddressData(address: Address) {
    const addressData = await getEthereumAddressData(address.hash)
    if (!addressData) return false

    // address.bytecode = getEthereumBytecode(address.hash)
    address.balance = addressData.balance
    address.txCount = addressData.txCount
    address.lastUsedAt = DateTime.fromSeconds(Number(addressData.txs[0].timeStamp))

    return true
}

/**
 * A worker used to fetch address data from different blockchains.
 */
const addressDataWorker = new Worker(
    addressDataQueue.name,
    async () => {
        const fetchTime = DateTime.now().minus({ hours: addressDataConfig.fetchEvery }).toSQL()

        // Recover the first address that needs to be fetched,
        // either because of the fetch time or because it has never been fetched
        const address = await Address.query().where("fetchedAt", "<", fetchTime).orWhereNull("fetchedAt").first()
        if (!address) return

        await address.load("chain")

        let res = false
        switch (address.chain.name) {
            case "bitcoin":
                res = await fetchBitcoinAddressData(address)
                break
            case "ethereum":
                res = await fetchEthereumAddressData(address)
                break
        }

        // No matter the result, update the fetchedAt field
        // to avoid fetching the same address again
        address.fetchedAt = DateTime.now()
        await address.save()

        if (!res) {
            logger.debug(`failed to fetch data for address '${address.hash}', skipping..`)
            return
        }

        address.isReady = true
        await address.save()

        logger.info(`fetched data for address '${address.hash}'`)
    },
    workersConfig
)

/**
 * Event listener for the 'failed' event of the worker.
 */
addressDataWorker.on("failed", (job, error) => {
    if (!job) {
        logger.error(`failed to fetch data for an address: ${error}`)
        return
    }

    logger.error(`failed to fetch data for address '${job.data.address.hash}': ${error}`)
})

export default addressDataWorker
