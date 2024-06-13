import queuesConfig from "#config/queues"
import { Queue } from "bullmq"

/**
 * The queue..
 */
export const mainQueue = new Queue("main", { ...queuesConfig })
