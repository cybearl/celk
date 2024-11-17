import { MemorySlotWithCache } from "#kernel/utils/instructions"

// TODO: Implement keccak256
import { keccak_256 } from "@noble/hashes/sha3"

/**
 * The `Keccak256Algorithm` class is used to hash data coming from a `Cache` instance at a certain position given by an
 * input `MemorySlot`, and rewrite the hash back to the same or another `Cache` instance at a position given
 * by an output `MemorySlot`.
 *
 * **Note:** For now, this class uses the `keccak_256` hash function from the `@noble/hashes` package.
 */
export default class Keccak256Algorithm {
    /**
     * Hashes the data in the attached cache at a certain position, and writes the hash back to the same
     * or another cache at another position.
     *
     * Output Length: 32 bytes.
     * @param inputSlotWithCache The position of the data to read in the attached cache (optional, defaults to 0 => length),
     * @param outputSlotWithCache The position to write the hash to in the attached cache (optional, defaults to 0 => data length).
     */
    hash(inputSlotWithCache: MemorySlotWithCache, outputSlotWithCache: MemorySlotWithCache): void {
        outputSlotWithCache.cache.writeUint8Array(
            keccak_256
                .create()
                .update(inputSlotWithCache.cache.subarray(inputSlotWithCache?.start, inputSlotWithCache?.end))
                .digest(),
            outputSlotWithCache?.start
        )
    }
}
