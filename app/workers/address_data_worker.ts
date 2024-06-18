import addressDataConfig from "#config/address_data"
import workersConfig from "#config/workers"
import { getBitcoinAddressData, getEthereumAddressData, getEthereumBytecode } from "#lib/apis/web3"
import Address from "#models/address"
import { addressDataQueue } from "#queues/index"
import logger from "@adonisjs/core/services/logger"
import { Worker } from "bullmq"
import { DateTime } from "luxon"

/**
 * Fetch the data of a Bitcoin address.
 * @param address The address to fetch the data of.
 */
async function fetchBitcoinAddressData(address: Address) {
    const addressData = await getBitcoinAddressData(address.hash)
    if (!addressData) {
        logger.debug(`failed to fetch data for address '${address.hash}', skipping..`)
        return null
    }

    // TODO: Bytecode
    address.balance = addressData.final_balance / 1e8
    address.txCount = addressData.n_tx
    address.lastUsedAt = DateTime.fromSeconds(addressData.txs[0].time)
}

/**
 * Fetch the data of an Ethereum address.
 * @param address The address to fetch the data of.
 */
async function fetchEthereumAddressData(address: Address) {
    const addressData = await getEthereumAddressData(address.hash)
    if (!addressData) {
        logger.debug(`failed to fetch data for address '${address.hash}', skipping..`)
        return null
    }

    address.bytecode = getEthereumBytecode(address.hash)
    address.balance = addressData.balance
    address.txCount = addressData.txCount
    address.lastUsedAt = DateTime.fromSeconds(Number(addressData.txs[0].timeStamp))
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

        switch (address.chain.name) {
            case "bitcoin":
                await fetchBitcoinAddressData(address)
                break
            case "ethereum":
                await fetchEthereumAddressData(address)
                break
            default:
                logger.error(`unknown chain '${address.chain.name}' for address '${address.hash}', skipping..`)
                return
        }

        address.isReady = true
        address.fetchedAt = DateTime.now()
        await address.save()

        logger.info(`fetched data for address '${address.hash}'`)
    },
    workersConfig
)

export default addressDataWorker
