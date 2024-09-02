import env from "#start/env"
import { default as IORedis } from "ioredis"

/**
 * The configuration for the Redis database.
 */
const redisConfig: IORedis.RedisOptions = {
    // https://github.com/nocodb/nocodb/issues/2452#issue-1279896470
    maxRetriesPerRequest: null,
}

/**
 * A reusable IORedis connector for the Redis database.
 */
const redisConnector = new IORedis.Redis(env.get("REDIS_URL"), redisConfig)

export default redisConnector
