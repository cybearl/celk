import { MemorySlotWithCacheInstance } from "#kernel/utils/instructions"

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
     * Hashes the data of a `Cache` instance at a certain position given by an input `MemorySlot`,
     * and writes the hash to the same or another `Cache` instance at a position given by an output `MemorySlot`.
     *
     * Output Length: 32 bytes.
     * @param inputSlotWithCacheInstance The position of the data to read in the attached cache (optional, defaults to 0 => length),
     * @param outputSlotWithCacheInstance The position to write the hash to in the attached cache (optional, defaults to 0 => data length).
     */
    hash(
        inputSlotWithCacheInstance: MemorySlotWithCacheInstance,
        outputSlotWithCacheInstance: MemorySlotWithCacheInstance
    ): void {
        outputSlotWithCacheInstance.cache.writeUint8Array(
            keccak_256
                .create()
                .update(
                    inputSlotWithCacheInstance.cache.subarray(
                        inputSlotWithCacheInstance?.start,
                        inputSlotWithCacheInstance?.end
                    )
                )
                .digest(),
            outputSlotWithCacheInstance?.start
        )
    }
}
