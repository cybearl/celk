import logger from "@adonisjs/core/services/logger"
import { Worker } from "bullmq"

// List all the workers that should be started on AdonisJs boot
const workers: { [workerName: string]: Worker } = {}

/**
 * This provider is responsible for starting and stopping all the workers that are used in the application.
 */
export default class WorkersProvider {
    /**
     * Starts all the workers when the application is ready to accept incoming requests.
     *
     * More info: https://docs.adonisjs.com/guides/concepts/service-providers#ready
     */
    async ready() {
        // Start all the workers if they are not already running
        for (const workerName in workers) {
            const worker = workers[workerName]
            if (!worker.isRunning()) worker.run()
        }

        if (Object.keys(workers).length === 0) {
            logger.debug("no workers to start, skipping...")
            return
        }

        logger.debug(`started all workers successfully (${Object.keys(workers).join(", ")})`)
    }

    /**
     * Stops all the workers when the application is shutting down.
     *
     * More info: https://docs.adonisjs.com/guides/concepts/service-providers#shutdown
     */
    async shutdown() {
        // Stop all the workers if they are running
        for (const workerName in workers) {
            const worker = workers[workerName]
            if (worker.isRunning()) worker.close()
        }

        if (Object.keys(workers).length === 0) {
            logger.debug("no workers to stop, skipping...")
            return
        }

        logger.debug(`stopped all workers successfully (${Object.keys(workers).join(", ")})`)
    }
}
