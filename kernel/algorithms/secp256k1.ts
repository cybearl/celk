import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import { KernelErrors, fe } from "#lib/constants/errors"

// TODO: Implement secp256k1
import { secp256k1 } from "@noble/curves/secp256k1"

/**
 * The type definition of the public key generation mode:
 * - `compressed`: Compressed 33 bytes public key (with prefix `0x02` or `0x03` depending on the Y coordinate).
 * - `uncompressed`: Uncompressed 65 bytes public key (with prefix `0x04`).
 */
export type PublicKeyGenerationMode = "compressed" | "uncompressed"

/**
 * The `Secp256k1Algorithm` class is used to generate a public key from a private key
 * stored inside a `Cache` instance at a certain position given by an input `MemorySlot`,
 * and rewrite the public key back to the `Cache` instance at another
 * position given by an output `MemorySlot`.
 *
 * This class is a wrapper around the `secp256k1` function from the
 * `@noble/curves` package.
 */
export default class Secp256k1Algorithm {
    /**
     * Generates a public key from a private key stored inside a `Cache` instance
     * at a certain position, and writes the public key back to the `Cache` instance
     * at another position.
     *
     * Output Length: 33 bytes (uncompressed) or 65 bytes (compressed).
     * @param mode The public key generation mode (`compressed` or `uncompressed`).
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    generate(mode: PublicKeyGenerationMode, cache: Cache, inputSlot?: MemorySlot, outputSlot?: MemorySlot): void {
        if (mode === "compressed") {
            if (cache.length < 33) {
                throw new Error(
                    fe(KernelErrors.INVALID_CACHE_LENGTH, undefined, { length: cache.length, expected: 33 })
                )
            }
        } else {
            if (cache.length < 65) {
                throw new Error(
                    fe(KernelErrors.INVALID_CACHE_LENGTH, undefined, { length: cache.length, expected: 65 })
                )
            }
        }

        if (inputSlot && inputSlot.length !== 32) {
            throw new Error(
                fe(KernelErrors.INVALID_PRIVATE_KEY_LENGTH, undefined, { length: inputSlot.length, expected: 32 })
            )
        }

        cache.writeUint8Array(
            secp256k1.getPublicKey(cache.subarray(inputSlot?.start, inputSlot?.end), mode === "compressed"),
            outputSlot?.start
        )
    }
}
