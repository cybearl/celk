import { RestClientOptions } from "binance"

/**
 * The default configuration for Binance.
 */
const binanceConfig: RestClientOptions = {
    disableTimeSync: false,
    beautifyResponses: true,
    filterUndefinedParams: true,
}

export default binanceConfig
