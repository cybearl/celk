import { addressDataQueue } from "#queues/index"
import addressDataWorker from "#workers/address_data_worker"
import logger from "@adonisjs/core/services/logger"
import { Worker } from "bullmq"

// List all the workers that should be started on AdonisJs boot
const workers: { [workerName: string]: Worker } = {
    addressDataWorker,
}

/**
 * This provider is responsible for starting and stopping all the workers that are used in the application.
 */
export default class WorkersProvider {
    /**
     * Starts all the workers when the application is ready to accept incoming requests,
     * and schedules the address data queue to run every 10 seconds.
     *
     * More info: https://docs.adonisjs.com/guides/concepts/service-providers#ready
     */
    async ready() {
        if (process.env.CC === "true") return

        // Start all the workers if they are not already running
        for (const workerName in workers) {
            const worker = workers[workerName]
            if (!worker.isRunning()) worker.run()

            const addressDataWorkerName = Object.keys({ addressDataWorker })[0]
            if (workerName === addressDataWorkerName) {
                logger.info(`scheduled '${workerName}' to run every 10 seconds`)
                await addressDataQueue.add("address:data:cron", {}, { delay: 2000, repeat: { every: 10000 } })
            }
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
        if (process.env.CC === "true") return

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
