import redisConfig from "#config/redis"
import env from "#start/env"
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
            delay: env.get("NODE_ENV") === "production" ? 2048 : 1024,
        },

        // Auto-removal
        removeOnComplete: true,
        removeOnFail: true,
    },
}

export default queuesConfig
