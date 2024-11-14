import basicWorker from "#workers/basic_worker"
import logger from "@adonisjs/core/services/logger"
import { Worker } from "bullmq"

// List all the workers that should be started on AdonisJs boot
const workers: { [workerName: string]: Worker } = {
    basicWorker,
}

export default class WorkersProvider {
    /**
     * Starts all the workers during when the application is ready to accept incoming requests.
     * also initializes the stacks queue cron job.
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
            logger.info("no workers to start, skipping...")
            return
        }

        logger.info(`started all workers successfully (${Object.keys(workers).join(", ")})`)
    }

    /**
     * Stops all the workers when the application is shutting down.
     *
     * More info: https://docs.adonisjs.com/guides/concepts/service-providers#shutdown
     */
    async shutdown() {
        if (process.env.NO_LC === "true") return

        // Stop all the workers if they are running
        for (const workerName in workers) {
            const worker = workers[workerName]
            if (worker.isRunning()) worker.close()
        }

        logger.info(`stopped all workers successfully (${Object.keys(workers).join(", ")})`)
    }
}
