import addressDataConfig from "#config/address_data"
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
     * The options for the address data cron job.
     */
    private addressDataCronOptions = {
        delay: addressDataConfig.initialDelay,
        repeat: {
            every: addressDataConfig.repeatEvery,
        },
        removeOnComplete: true,
        removeOnFail: true,
    }

    /**
     * Starts all the workers when the application is ready to accept incoming requests,
     * and schedules the address data queue to run every x seconds.
     *
     * More info: https://docs.adonisjs.com/guides/concepts/service-providers#ready
     */
    async ready() {
        if (process.env.NO_LIFECYCLE === "true") {
            // Ensures that the address data cron job is not running
            await addressDataQueue.removeRepeatable("cron:address:data", this.addressDataCronOptions.repeat)
            return
        }

        // Start all the workers if they are not already running
        for (const workerName in workers) {
            const worker = workers[workerName]
            if (!worker.isRunning()) worker.run()

            const addressDataWorkerName = Object.keys({ addressDataWorker })[0]

            if (workerName === addressDataWorkerName) {
                await addressDataQueue.add("cron:address:data", {}, this.addressDataCronOptions)
                logger.info(`scheduled '${workerName}' to run every ${addressDataConfig.repeatEvery / 1000} second(s)`)
                logger.info(`address data will be automatically fetched every ${addressDataConfig.fetchEvery} hour(s)`)
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
        if (process.env.NO_LIFECYCLE === "true") return

        if (Object.keys(workers).length === 0) {
            logger.debug("no workers to stop, skipping...")
            return
        }

        // Stop all the workers if they are running
        for (const workerName in workers) {
            const worker = workers[workerName]
            if (worker.isRunning()) worker.close()
        }

        logger.debug(`stopped all workers successfully (${Object.keys(workers).join(", ")})`)
    }
}
