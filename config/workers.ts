import redisConfig from "#config/redis"
import { WorkerOptions } from "bullmq"

/**
 * The default configuration for workers.
 */
const workersConfig: WorkerOptions = {
    connection: redisConfig,
    autorun: true,
    concurrency: 1,
}

export default workersConfig
