import redisConfig from "#config/redis"
import { WorkerOptions } from "bullmq"

/**
 * The default configuration for workers.
 */
const workersConfig: WorkerOptions = {
    connection: redisConfig,
    autorun: true,
    concurrency: 8,
}

export default workersConfig
