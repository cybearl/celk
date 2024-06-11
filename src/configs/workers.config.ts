import type { WorkerOptions } from "bullmq";

import redisConfig from "configs/redis.config";


/**
 * The default configuration for workers.
 */
const workerConfig: WorkerOptions = {
    connection: redisConfig,
    autorun: true
};

export default workerConfig;
