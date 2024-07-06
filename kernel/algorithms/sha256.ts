import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import { sha256 } from "@noble/hashes/sha256"

/**
 * The `Sha256Algorithm` class is used to hash data coming from a
 * `Cache` instance at a certain position given by a `MemorySlot`,
 * and rewrite the hash back to the `Cache` instance at another
 * position given by another `MemorySlot`.
 *
 * This class is a wrapper around the `sha256` function from the
 * `@noble/hashes` package.
 */
export default class Sha256Algorithm {
    /**
     * Hashes the data from the `Cache` instance at a certain position,
     * and writes the hash back to the `Cache` instance at another position.
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    static hash(cache: Cache, inputSlot?: MemorySlot, outputSlot?: MemorySlot): void {
        cache.writeUint8Array(
            sha256.create().update(cache.subarray(inputSlot?.start, inputSlot?.end)).digest(),
            outputSlot?.start
        )
    }
}
