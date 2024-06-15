import binanceConfig from "#config/binance"
import errorCodes from "#lib/constants/errors"
import { internalError } from "#lib/utils/internal_responses"
import env from "#start/env"
import logger from "@adonisjs/core/services/logger"
import { MainClient } from "binance"

/**
 * The Binance client.
 */
const binanceClient = new MainClient({
    ...binanceConfig,
    api_key: env.get("BINANCE_API_KEY"),
    api_secret: env.get("BINANCE_API_SECRET"),
})

/**
 * This provider is responsible for testing the connectivity to Binance.
 */
export default class BinanceProvider {
    /**
     * Test the connectivity to Binance when the application is ready to accept incoming requests.
     */
    async ready() {
        const isConnected = await binanceClient.testConnectivity()

        if (!isConnected) {
            internalError(errorCodes.COULD_NOT_CONNECT_TO_BINANCE)
            process.exit(1)
        }

        const serverTime = await binanceClient.getServerTime()
        const timeDifference = serverTime - Date.now()
        logger.debug(`connected to Binance with a time-diff of ${timeDifference.toLocaleString("en-US")}ms`)
    }
}
