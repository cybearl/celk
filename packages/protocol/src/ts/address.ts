/**
 * Note: All changes to the protocol should be reflected on the C++ side of the Celk protocol.
 */

/**
 * The type of an address.
 */
export enum ADDRESS_TYPE {
    ETHEREUM = "ethereum",
    BTC_P2PKH = "btc-p2pkh", // "1..."   Base58Check
    BTC_P2WPKH = "btc-p2wpkh", // "bc1q..."  Bech32
    BTC_P2SH = "btc-p2sh", // "3..."   Base58Check (nested segwit)
    BTC_P2TR = "btc-p2tr", // "bc1p..."  Bech32m
}

/**
 * The network an address belongs to.
 */
export enum ADDRESS_NETWORK {
    BITCOIN = "bitcoin",
    ETHEREUM = "ethereum",
    POLYGON = "polygon",
    BSC = "bsc",
}

/**
 * The different private key generators available for an address.
 */
export enum ADDRESS_PRIVATE_KEY_GENERATOR {
    RandBytes = "rand-bytes",
    PCG64 = "pcg64", // Supports ranges, defaults to it when start and end ranges are provided
    Sequential = "sequential", // Supports ranges
}

/**
 * Whether each worker private key generator supports range bounds.
 */
export const ADDRESS_PRIVATE_KEY_GENERATOR_SUPPORTS_RANGE: Record<ADDRESS_PRIVATE_KEY_GENERATOR, boolean> = {
    [ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes]: false,
    [ADDRESS_PRIVATE_KEY_GENERATOR.PCG64]: true,
    [ADDRESS_PRIVATE_KEY_GENERATOR.Sequential]: true,
}
