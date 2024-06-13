import redisConfig from "#config/redis"
import { QueueOptions } from "bullmq"

/**
 * The default configuration for queues.
 */
const queuesConfig: QueueOptions = {
    connection: redisConfig,
    defaultJobOptions: {
        // Job attempts
        attempts: 3,

        // Delayed jobs
        backoff: {
            type: "exponential",
            delay: 5000,
        },

        // Auto-removal
        removeOnComplete: true,
        removeOnFail: true,
    },
}

export default queuesConfig
