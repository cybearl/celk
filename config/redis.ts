import env from "#start/env"
import { RedisOptions } from "bullmq"

/**
 * The Redis connection configuration.
 */
const redisConfig: RedisOptions = {
    host: env.get("REDIS_HOST"),
    port: env.get("REDIS_PORT"),
    password: env.get("REDIS_PASSWORD"),
    db: 0,
    keyPrefix: "",
}

export default redisConfig
