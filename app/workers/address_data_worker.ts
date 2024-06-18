import workersConfig from "#config/workers"
import { addressDataQueue } from "#queues/index"
import logger from "@adonisjs/core/services/logger"
import { Worker } from "bullmq"

// /**
//  * The return type of the static `updateAddressData` method.
//  */
// export type AddressData = {
//     balance: number | null
//     txCount: number | null
//     lastUsedAt: DateTime | null
//     fetchedAt: DateTime
// }

// /**
//  * Updates an address with its data.
//  * @param address The address to update.
//  * @returns The fetched address data.
//  */
// static async updateAddressData(address: Address): Promise<AddressData | null> {
//     await address.load("chain")

//     if (address.chain.name === "bitcoin") {
//         const addressData = await getBitcoinAddressData(address.hash)
//         if (!addressData) return null

//         address.balance = addressData.final_balance / 1e8 // Convert from satoshis to BTC
//         address.txCount = addressData.n_tx

//         const lastTx = addressData.txs[0]
//         address.lastUsedAt = DateTime.fromSeconds(lastTx.time)
//     } else if (address.chain.name === "ethereum") {
//         address.bytecode = getEthereumBytecode(address.hash)

//         const addressData = await getEthereumAddressData(address.hash)
//         if (!addressData) return null

//         address.balance = addressData.balance
//         address.txCount = addressData.txCount

//         const lastTx = addressData.txs[0]
//         address.lastUsedAt = DateTime.fromSeconds(Number(lastTx.timeStamp))
//     }

//     address.fetchedAt = DateTime.now()
//     await address.save()

//     return {
//         balance: address.balance,
//         txCount: address.txCount,
//         lastUsedAt: address.lastUsedAt,
//         fetchedAt: address.fetchedAt,
//     }
// }

/**
 * A worker used to fetch address data from different blockchains.
 */
const addressDataWorker = new Worker(
    addressDataQueue.name,
    async (job) => {
        logger.info(`processing job '${job.name}' with data: ${JSON.stringify(job.data)}`)
        // Add your worker code here
    },
    workersConfig
)

export default addressDataWorker
