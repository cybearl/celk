declare module NodeJS {
    interface ProcessEnv {
        // Redis database
        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_PASSWORD: string;
    }
}