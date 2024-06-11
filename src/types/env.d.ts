declare module NodeJS {
    interface ProcessEnv {
        // Default value
        [key: string]: string | undefined;

        // Node environment
        NODE_ENV: "development" | "production";

        // PostgreSQL database
        POSTGRES_HOST: string;
        POSTGRES_PORT: string;
        POSTGRES_USER: string;
        POSTGRES_PASSWORD: string;
        POSTGRES_DB: string;

        // Redis database
        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_PASSWORD: string;
    }
}