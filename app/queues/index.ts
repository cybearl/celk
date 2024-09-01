import queuesConfig from "#config/queues"
import { Queue } from "bullmq"

/**
 * A queue used to fetch address data from different blockchains.
 */
export const addressDataQueue = new Queue("address-data", { ...queuesConfig })
