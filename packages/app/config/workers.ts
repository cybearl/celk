import path from "node:path"

/**
 * The main configuration for the workers.
 */
const WORKERS_CONFIG = {
    binaryPath: path.join(process.cwd(), ".celk", "worker"),
    dumpsDir: path.join(process.cwd(), ".celk", "dumps"),
}

export default WORKERS_CONFIG
