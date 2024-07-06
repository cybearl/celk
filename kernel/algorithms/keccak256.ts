import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import { keccak_256 } from "@noble/hashes/sha3"

/**
 * The `Keccak256Algorithm` class is used to hash data coming from a
 * `Cache` instance at a certain position given by a `MemorySlot`,
 * and rewrite the hash back to the `Cache` instance at another
 * position given by another `MemorySlot`.
 *
 * This class is a wrapper around the `keccak_256` function from the
 * `@noble/hashes` package.
 */
export default class Keccak256Algorithm {
    /**
     * Hashes the data from the `Cache` instance at a certain position,
     * and writes the hash back to the `Cache` instance at another position.
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    static hash(cache: Cache, inputSlot?: MemorySlot, outputSlot?: MemorySlot): void {
        cache.writeUint8Array(
            keccak_256.create().update(cache.subarray(inputSlot?.start, inputSlot?.end)).digest(),
            outputSlot?.start
        )
    }
}
