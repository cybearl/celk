import type { QueueOptions } from "bullmq";

import redisConfig from "configs/redis.config";


/**
 * The default configuration for queues.
 */
const queueConfig: QueueOptions = {
    connection: redisConfig,
    defaultJobOptions: {
        // Job attempts
        attempts: 3,

        // Delayed jobs
        backoff: {
            type: "exponential",
            delay: 5000
        },

        // Auto-removal
        removeOnComplete: true,
        removeOnFail: true
    }
};

export default queueConfig;
