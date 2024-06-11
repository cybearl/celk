import type { RedisOptions } from "bullmq";


/**
 * The Redis connection configuration.
 */
const redisConfig: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    keyPrefix: ""
};

export default redisConfig;
