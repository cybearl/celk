import { ADDRESS_NETWORK } from "@app/db/schema/address"

/**
 * The main configuration for any Web3-related operations.
 */
const WEB3_CONFIG = {
    urls: {
        [ADDRESS_NETWORK.BITCOIN]: {
            addressEndpoint: "https://mempool.space/api/address",
        },
        [ADDRESS_NETWORK.ETHEREUM]: {
            p1: "https://ethereum-rpc.publicnode.com",
            p2: "https://cloudflare-eth.com",
        },
        [ADDRESS_NETWORK.BSC]: {
            p1: "https://bsc-dataseed.binance.org",
            p2: "https://bsc-dataseed1.binance.org",
        },
        [ADDRESS_NETWORK.POLYGON]: {
            p1: "https://polygon-bor-rpc.publicnode.com",
            p2: "https://tenderly.rpc.polygon.community",
        },
    },
}

export default WEB3_CONFIG
