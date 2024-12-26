import { MemorySlotWithCI } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"
import secp256k1 from "secp256k1"

/**
 * The (string) hex number representing the highest possible value for a 256-bit unsigned integer
 * on the secp256k1 curve, also known as the order of the curve.
 */
export const N_STR = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"

/**
 * The number representing the highest possible value for a 256-bit unsigned integer
 * on the secp256k1 curve, also known as the order of the curve (-1).
 */
export const N_BIGINT = 2n ** 256n - 0x14551231950b75fc4402da1732fc9bebfn - 1n

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
     * Output Length: 33 bytes (compressed), 65 bytes (uncompressed) or 64 bytes (evm - no prefix).
     * @param mode The public key generation mode (`compressed`, `uncompressed` or `evm`).
     * @param inputSlotWithCI The position of the data to read in the attached cache (optional, defaults to 0 => length),
     * @param outputSlotWithCI The position to write the hash to in the attached cache (optional, defaults to 0 => data length).
     */
    generate(
        mode: PublicKeyGenerationMode,
        inputSlotWithCI: MemorySlotWithCI,
        outputSlotWithCI: MemorySlotWithCI
    ): void {
        if (inputSlotWithCI.length !== 32) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_PRIVATE_KEY_LENGTH, undefined, {
                    length: inputSlotWithCI.length,
                    expected: 32,
                })
            )
        }

        const publicKeyLength = this.getPublicKeyLength(mode)

        if (outputSlotWithCI.cache.length < publicKeyLength) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_CACHE_LENGTH, undefined, {
                    length: outputSlotWithCI.cache.length,
                    expected: publicKeyLength,
                })
            )
        }

        outputSlotWithCI.cache.writeUint8Array(
            secp256k1.publicKeyCreate(
                inputSlotWithCI.cache.copy(inputSlotWithCI?.start, inputSlotWithCI?.length),
                mode === "compressed"
            ),
            outputSlotWithCI?.start,
            undefined, // Dynamic, let the function decide
            mode === "evm" ? 1 : 0 // Remove the prefix for EVM
        )
    }

    /**
     * Tweaks the public key stored inside a `Cache` instance at a certain position given by an input `MemorySlot`,
     * using a tweak stored inside the same or another `Cache` instance at a position given by a tweak `MemorySlot`,
     * and writes the tweaked public key to the same or another `Cache` instance at a position given.
     * @param inputSlotWithCI The position of the public key to read in the attached cache.
     * @param tweakSlotWithCI The position of the tweak to read in the attached cache.
     * @param outputSlotWithCI The position to write the tweaked public key to in the attached cache.
     */
    tweak(
        inputSlotWithCI: MemorySlotWithCI,
        tweakSlotWithCI: MemorySlotWithCI,
        outputSlotWithCI: MemorySlotWithCI
    ): void {
        if (inputSlotWithCI.length !== 33 && inputSlotWithCI.length !== 65) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_PUBLIC_KEY_LENGTH, undefined, {
                    length: inputSlotWithCI.length,
                    expected: 33,
                })
            )
        }

        if (outputSlotWithCI.cache.length < inputSlotWithCI.length) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_CACHE_LENGTH, undefined, {
                    length: outputSlotWithCI.cache.length,
                    expected: inputSlotWithCI.length,
                })
            )
        }

        outputSlotWithCI.cache.writeUint8Array(
            secp256k1.publicKeyTweakAdd(
                inputSlotWithCI.cache.copy(inputSlotWithCI?.start, inputSlotWithCI?.length),
                tweakSlotWithCI.cache.copy(tweakSlotWithCI?.start, tweakSlotWithCI?.length)
            ),
            outputSlotWithCI?.start
        )
    }
}
