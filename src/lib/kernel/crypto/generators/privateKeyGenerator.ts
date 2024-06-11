import Cache from "lib/kernel/cache";


/**
 * The generation mode of the private key, either `RANDOM`, `ASCENDING` or `DESCENDING`.
 * - `RANDOM` for a fully random private key in the given range.
 * - `ASCENDING` for an ascending private key in the given range.
 * - `DESCENDING` for a descending private key in the given range.
 */
export type PrivateKeyGenMode = "RANDOM" | "ASCENDING" | "DESCENDING";

/**
 * Generates a private key within a given range,
 * and write it to the cache at a given memory slot.
 *
 * Supports multiple generation modes while also providing advanced
 * randomness check and distribution.
 */
export default class PrivateKeyGenerator {
    /**
     * Temporarily stores randomly generated numbers
     */
    private storage = new Cache(128);


    constructor(cache: Cache) {

    }
}