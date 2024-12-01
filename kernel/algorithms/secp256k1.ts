import { MemorySlotWithCacheInstance } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"

// TODO: Implement a better algorithm that supports 64 bytes public keys.
import { secp256k1 } from "@noble/curves/secp256k1"

/**
 * The (string) hex number representing the highest possible value for a 256-bit unsigned integer
 * on the secp256k1 curve, also known as the order of the curve.
 */
export const N_STR = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"

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
     * Generates a public key from a private key stored inside a `Cache` instance at a certain position
     * given by an input `MemorySlot`, and writes the key to the same or another `Cache` instance
     * at a position given by an output `MemorySlot`.
     *
     * Output Length: 33 bytes (uncompressed) or 65 bytes (compressed).
     * @param mode The public key generation mode (`compressed` or `uncompressed`).
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    generate(
        mode: PublicKeyGenerationMode,
        inputSlotWithCacheInstance: MemorySlotWithCacheInstance,
        outputSlotWithCacheInstance: MemorySlotWithCacheInstance
    ): void {
        if (mode === "compressed") {
            if (outputSlotWithCacheInstance.cache.length < 33) {
                throw new Error(
                    cyGeneral.errors.stringifyError(KernelErrors.INVALID_CACHE_LENGTH, undefined, {
                        length: outputSlotWithCacheInstance.cache.length,
                        expected: 33,
                    })
                )
            }
        } else {
            if (outputSlotWithCacheInstance.cache.length < 65) {
                throw new Error(
                    cyGeneral.errors.stringifyError(KernelErrors.INVALID_CACHE_LENGTH, undefined, {
                        length: outputSlotWithCacheInstance.cache.length,
                        expected: 65,
                    })
                )
            }
        }

        if (inputSlotWithCacheInstance.length !== 32) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_PRIVATE_KEY_LENGTH, undefined, {
                    length: inputSlotWithCacheInstance.length,
                    expected: 32,
                })
            )
        }

        outputSlotWithCacheInstance.cache.writeUint8Array(
            secp256k1.getPublicKey(
                inputSlotWithCacheInstance.cache.copy(
                    inputSlotWithCacheInstance?.start,
                    inputSlotWithCacheInstance?.length
                ),
                mode === "compressed"
            ),
            outputSlotWithCacheInstance?.start
        )
    }
}
