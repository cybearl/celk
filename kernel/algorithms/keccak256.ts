import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import { keccak_256 } from "@noble/hashes/sha3"

/**
 * The `Keccak256Algorithm` class is used to hash data coming from a
 * `Cache` instance at a certain position given by an input `MemorySlot`,
 * and rewrite the hash back to the `Cache` instance at another
 * position given by an output `MemorySlot`.
 */
export default class Keccak256Algorithm {
    /** Round constants. */
    // prettier-ignore
    private readonly _RND = new Uint32Array([
        0x00000001, 0x00008082, 0x0000808a, 0x80008000, 0x0000808b, 0x80000001, 0x80008081, 0x00008009,
        0x0000008a, 0x00000088, 0x80008009, 0x8000000a, 0x8000808b, 0x0000008b, 0x00008089, 0x00008003,
        0x00008002, 0x00000080, 0x0000800a, 0x8000000a, 0x80008081, 0x00008080, 0x80000001, 0x80008008,
        0x8000800a, 0x80000008, 0x0000008a, 0x80008082, 0x00008000, 0x80008080, 0x8000000a, 0x00008082,
        0x0000800a, 0x80000001, 0x00008000, 0x80008000, 0x80008081, 0x00008089, 0x80008009, 0x0000008b,
        0x00000083, 0x00008003, 0x80000008, 0x80008088, 0x80000088, 0x00000080, 0x80008009, 0x00008001,
        0x0000008b, 0x80000081, 0x00008008
    ])

    /** Rotation constants. */
    // prettier-ignore
    private readonly _ROT = new Uint8Array([
        0, 36, 3, 41, 18, 1, 44, 10, 45, 2, 62, 6, 43, 15, 61, 28,
        55, 25, 21, 56, 27, 20, 39, 8, 14, 49, 17, 36, 10, 50, 13, 39,
        30, 44, 7, 9, 48, 51, 54, 56, 53, 34, 57, 39, 58, 32, 32, 31,
        37, 38, 33, 18, 27, 58, 22, 32, 32, 25, 63, 23, 53, 52, 45
    ])

    /**
     * Hashes the data from the `Cache` instance at a certain position,
     * and writes the hash back to the `Cache` instance at another position.
     *
     * Output Length: 32 bytes.
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
