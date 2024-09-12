import addressDataConfig from "#config/address_data"
import workersConfig from "#config/workers"
import { getBitcoinAddressData, getEthereumAddressData } from "#lib/apis/web3"
import { getBitcoinBytecode, getEthereumBytecode } from "#lib/utils/addresses"
import Address from "#models/address"
import { addressDataQueue } from "#queues/index"
import logger from "@adonisjs/core/services/logger"
import { UnrecoverableError, Worker } from "bullmq"
import { DateTime } from "luxon"

/**
 * An enum containing the different errors.
 */
enum AddressDataError {
    CouldNotFetch = "could-not-fetch",
}

/**
 * Fetch the data of a Bitcoin address.
 * @param address The address to fetch the data of.
 */
export async function fetchBitcoinAddressData(address: Address) {
    try {
        address.bytecode = getBitcoinBytecode(address.hash, address.type)

        const addressData = await getBitcoinAddressData(address.hash)
        if (!addressData) return false

        address.balance = addressData.final_balance / 1e8
        address.txCount = addressData.n_tx
        address.lastUsedAt = DateTime.fromSeconds(addressData.txs[0].time)

        return true
    } catch (error) {
        logger.error(`failed to fetch data for address '${address.hash}', skipping..`)
        logger.debug(error)
        return false
    }
}

/**
 * Fetch the data of an Ethereum address.
 * @param address The address to fetch the data of.
 */
export async function fetchEthereumAddressData(address: Address) {
    try {
        address.bytecode = getEthereumBytecode(address.hash)

        const addressData = await getEthereumAddressData(address.hash)
        if (!addressData) return false

        address.balance = addressData.balance
        address.txCount = addressData.txCount
        address.lastUsedAt = DateTime.fromSeconds(Number(addressData.txs[0].timeStamp))

        return true
    } catch (error) {
        logger.error(`failed to fetch data for address '${address.hash}', skipping..`)
        logger.debug(error)
        return false
    }
}

/**
 * A worker used to fetch address data from different blockchains.
 */
const addressDataWorker = new Worker(
    addressDataQueue.name,
    async (job) => {
        if (process.env.NO_LIFECYCLE === "true") return

        const fetchTime = DateTime.now().minus({ hours: addressDataConfig.fetchEvery }).toSQL()

        // Recover the first address that needs to be fetched,
        // either because of the fetch time or because it has never been fetched
        const address = await Address.query()
            .where("fetched_at", "<", fetchTime)
            .orWhereNull("fetched_at")
            .andWhereNot("is_locked", true)
            .first()
        if (!address) return

        await address.load("chain")

        let fetched = false
        switch (address.chain.name) {
            case "bitcoin":
                fetched = await fetchBitcoinAddressData(address)
                break
            case "ethereum":
                fetched = await fetchEthereumAddressData(address)
                break
        }

        // No matter the result, update the fetchedAt field
        // to avoid fetching the same address again
        address.fetchedAt = DateTime.now()

        if (!fetched) {
            address.isReady = false
            await address.save()
            throw new UnrecoverableError(AddressDataError.CouldNotFetch)
        } else {
            address.isReady = true
            await address.save()
        }

        job.updateData({ address })
    },
    workersConfig
)

/**
 * Event listener for the 'failed' event of the worker.
 */
addressDataWorker.on("failed", (job, error) => {
    if (!job || !job.data.address) {
        // Auto-aborted jobs are not considered failures
        if (error.message === "aborted") return

        // Error while fetching already have their own error message
        if (error.message === AddressDataError.CouldNotFetch) return

        logger.error(`failed to fetch data for an address (unknown):\n${error}`)
        return
    }

    logger.error(`failed to fetch data for address '${job.data.address.hash}':\n${error}`)
})

/**
 * Event listener for the 'completed' event of the worker.
 */
addressDataWorker.on("completed", (job) => {
    if (!job || !job.data.address) return
    logger.info(`fetched data for address '${job.data.address.hash}'..`)
})

export default addressDataWorker
