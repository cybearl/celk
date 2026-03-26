import { PUBLIC_ENV } from "@app/config/env"
import WEB3_CONFIG from "@app/config/web3"
import { ADDRESS_NETWORK } from "@app/db/schema/address"
import { FallbackProvider, JsonRpcProvider } from "ethers"

/**
 * The JSON-RPC provider for Ethereum.
 */
const ethereumJsonRpcProvider = new FallbackProvider([
    {
        provider: new JsonRpcProvider(WEB3_CONFIG.urls[ADDRESS_NETWORK.ETHEREUM].p1),
        priority: 1,
        stallTimeout: 8000,
    },
    {
        provider: new JsonRpcProvider(WEB3_CONFIG.urls[ADDRESS_NETWORK.ETHEREUM].p2),
        priority: 2,
        stallTimeout: 8000,
    },
])

/**
 * The JSON-RPC provider for Binance Smart Chain.
 */
const bscJsonRpcProvider = new FallbackProvider([
    {
        provider: new JsonRpcProvider(WEB3_CONFIG.urls[ADDRESS_NETWORK.BSC].p1),
        priority: 1,
        stallTimeout: 8000,
    },
    {
        provider: new JsonRpcProvider(WEB3_CONFIG.urls[ADDRESS_NETWORK.BSC].p2),
        priority: 2,
        stallTimeout: 8000,
    },
])

/**
 * The JSON-RPC provider for Polygon.
 */
const polygonJsonRpcProvider = new FallbackProvider([
    {
        provider: new JsonRpcProvider(WEB3_CONFIG.urls[ADDRESS_NETWORK.POLYGON].p1),
        priority: 1,
        stallTimeout: 8000,
    },
    {
        provider: new JsonRpcProvider(WEB3_CONFIG.urls[ADDRESS_NETWORK.POLYGON].p2),
        priority: 2,
        stallTimeout: 8000,
    },
])

/**
 * The type for the JSON-RPC providers mapping instance.
 *
 * Note: Bitcoin is included but set to null as UTXO-based.
 */
type JsonRpcProviders = {
    [network in ADDRESS_NETWORK]: FallbackProvider | null
}

// Using a global variable to prevent multiple re-instantiations of the JSON-RPC providers.
let globalJsonRpcProviders: JsonRpcProviders | undefined

/**
 * A mapping between address networks and their respective JSON-RPC providers.
 */
export const jsonRpcProviders: JsonRpcProviders = globalJsonRpcProviders ?? {
    [ADDRESS_NETWORK.ETHEREUM]: ethereumJsonRpcProvider,
    [ADDRESS_NETWORK.BSC]: bscJsonRpcProvider,
    [ADDRESS_NETWORK.POLYGON]: polygonJsonRpcProvider,
    [ADDRESS_NETWORK.BITCOIN]: null,
}

// Writing back to the global variable
if (PUBLIC_ENV.nodeEnv !== "production") globalJsonRpcProviders = jsonRpcProviders
