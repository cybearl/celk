import path from "node:path"

/**
 * The main configuration for the workers.
 */
const WORKERS_CONFIG = {
    binaryPath: path.join(process.cwd(), ".celk", "worker"),
    dumpsDir: path.join(process.cwd(), ".celk", "dumps"),
    matchesDir: path.join(process.cwd(), ".celk", "matches"),

    // Fallback synchronization retry settings when the config
    // cannot be loaded from the DB
    syncRetry: {
        maxRetries: 5,
        baseDelayMs: 5000, // 5 seconds
        maxDelayMs: 3_600_000, // 1 hour
    },

    // Heartbeat settings passed to each spawned worker process
    heartbeat: {
        intervalMs: 5000, // Worker sends a heartbeat every 5 seconds
        timeoutMs: 15_000, // Worker kills itself if no ack within 15 seconds
    },

    // How long the manager waits for a worker to exit gracefully before force-killing it
    stopGraceMs: 5000, // 5 seconds
}

export default WORKERS_CONFIG
