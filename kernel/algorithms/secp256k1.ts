import { MemorySlotWithCacheInstance } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"
import secp256k1 from "secp256k1"

/**
 * The (string) hex number representing the highest possible value for a 256-bit unsigned integer
 * on the secp256k1 curve, also known as the order of the curve.
 */
export const N_STR = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"

/**
 * The type definition of the public key generation mode:
 * - `compressed`: Compressed 33 bytes public key (with prefix `0x02` or `0x03` depending on the Y coordinate).
 * - `uncompressed`: Uncompressed 65 bytes public key (with prefix `0x04`).
 * - `evm`: EVM-compatible 64 bytes public key (without prefix).
 */
export type PublicKeyGenerationMode = "compressed" | "uncompressed" | "evm"

/**
 * The `Secp256k1Algorithm` class is used to generate a public key from a private key
 * stored inside a `Cache` instance at a certain position given by an input `MemorySlot`,
 * and rewrite the public key back to the `Cache` instance at another
 * position given by an output `MemorySlot`.
 *
 * This class is a wrapper around the `secp256k1` function from the
 * `secp256k1` package.
 */
export default class Secp256k1Algorithm {
    /**
     * Get the proper byte length based on the public key generation mode.
     * @param mode The public key generation mode (`compressed`, `uncompressed` or `evm`).
     * @returns The byte length of the public key.
     */
    getPublicKeyLength(mode: PublicKeyGenerationMode): number {
        switch (mode) {
            case "compressed":
                return 33
            case "uncompressed":
                return 65
            case "evm":
                return 64
        }
    }

    /**
     * Generates a public key from a private key stored inside a `Cache` instance at a certain position
     * given by an input `MemorySlot`, and writes the key to the same or another `Cache` instance
     * at a position given by an output `MemorySlot`.
     *
     * Output Length: 33 bytes (compressed), 65 bytes (uncompressed) or 64 bytes (evm).
     * @param mode The public key generation mode (`compressed`, `uncompressed` or `evm`).
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    generate(
        mode: PublicKeyGenerationMode,
        inputSlotWithCacheInstance: MemorySlotWithCacheInstance,
        outputSlotWithCacheInstance: MemorySlotWithCacheInstance
    ): void {
        if (inputSlotWithCacheInstance.length !== 32) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_PRIVATE_KEY_LENGTH, undefined, {
                    length: inputSlotWithCacheInstance.length,
                    expected: 32,
                })
            )
        }

        const publicKeyLength = this.getPublicKeyLength(mode)

        if (outputSlotWithCacheInstance.cache.length < publicKeyLength) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_CACHE_LENGTH, undefined, {
                    length: outputSlotWithCacheInstance.cache.length,
                    expected: publicKeyLength,
                })
            )
        }

        outputSlotWithCacheInstance.cache.writeUint8Array(
            secp256k1.publicKeyCreate(
                inputSlotWithCacheInstance.cache.copy(
                    inputSlotWithCacheInstance?.start,
                    inputSlotWithCacheInstance?.length
                ),
                mode === "compressed"
            ),
            outputSlotWithCacheInstance?.start,
            undefined, // Dynamic, let the function decide
            mode === "evm" ? 1 : 0
        )
    }
}
