import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import externalLogger from "#lib/utils/external_logger"
import { cyGeneral } from "@cybearl/cypack"
import os from "node:os"

/**
 * The type definition of the options for the `PrivateKeyGenerator` class.
 */
export type PrivateKeyGeneratorOptions = {
    privateKeySize?: number
    lowerBound?: bigint
    upperBound?: bigint
    endianness?: "BE" | "LE"
}

/**
 * The default options for the `PrivateKeyGenerator` class.
 */
const defaultOptions: Required<PrivateKeyGeneratorOptions> = {
    privateKeySize: 32,
    lowerBound: 0n,
    upperBound: 2n ** 256n - 1n,
    endianness: os.endianness(),
}

/**
 * The type definition for a bound.
 */
type Bound = {
    value: Cache
    bytesLength: number
}

/**
 * The `PrivateKeyGenerator` class is used to generate a private key within a given range.
 *
 * Note that the range of the private key is in bytes, not directly in numbers, which drastically
 * improves the performance of the generator, but also limits the precision of the range to be in
 * multiples of 8 bits.
 */
export default class PrivateKeyGenerator {
    /**
     * The private key represented as a `Cache` instance.
     */
    privateKey!: Cache

    /**
     * The highest possible value of the private key based on its size.
     */
    private _maxValue!: bigint

    /**
     * The lower bound of the private key to generate.
     */
    private _lowerBound!: Bound

    /**
     * The upper bound of the private key to generate.
     */
    private _upperBound!: Bound

    /**
     * Creates a new `PrivateKeyGenerator` instance.
     * @param options The available options:
     * - privateKeySize The size of the private key to generate (optional, defaults to 32).
     * - lowerBound The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - upperBound The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - endianness The endianness to use (optional, defaults to the platform's endianness).
     */
    constructor(options?: PrivateKeyGeneratorOptions) {
        this.setOptions(options)
    }

    /**
     * The memory slot that can be used to read the private key.
     */
    get memorySlot(): MemorySlot {
        return {
            start: 0,
            length: this.privateKey.length,
            end: this.privateKey.length,
        }
    }

    /**
     * Set the options for the private key generator.
     * @param options The available options:
     * - privateKeySize The size of the private key to generate (optional, defaults to 32).
     * - lowerBound The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - upperBound The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - endianness The endianness to use (optional, defaults to the platform's endianness).
     */
    setOptions(options: PrivateKeyGeneratorOptions = defaultOptions): void {
        if (options?.privateKeySize && options.privateKeySize <= 0) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_LENGTH,
                    "The private key size must be greater than 0."
                )
            )
        }

        this.privateKey = new Cache(options?.privateKeySize ?? defaultOptions.privateKeySize)
        this._maxValue = 2n ** BigInt(this.privateKey.length * 8) - 1n

        const lowerBound = options.lowerBound ?? 0n
        const upperBound = options.upperBound ?? this._maxValue

        if (lowerBound < 0n) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The lower bound must be greater than or equal to 0."
                )
            )
        }

        if (upperBound < 0n) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be greater than or equal to 0."
                )
            )
        }

        if (upperBound === lowerBound) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper and lower bounds must not be equal."
                )
            )
        }

        if (upperBound < lowerBound) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be greater than or equal to the lower bound."
                )
            )
        }

        if (upperBound > this._maxValue) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be less than or equal to the maximum value of the private key based on its size."
                )
            )
        }

        const lowerBoundBytesLength = Math.ceil(lowerBound.toString(16).length / 2)
        this._lowerBound = {
            value: Cache.fromBigInt(lowerBound, lowerBoundBytesLength),
            bytesLength: lowerBoundBytesLength,
        }

        const upperBoundBytesLength = Math.ceil(upperBound.toString(16).length / 2)
        this._upperBound = {
            value: Cache.fromBigInt(upperBound, upperBoundBytesLength),
            bytesLength: upperBoundBytesLength,
        }

        this.generate(options.endianness)
    }

    /**
     * Generates a new private key following the bounds set in the options, using the
     * principle of rejection sampling based on a random number of bytes between the needed
     * number of bytes for the lower and upper bounds.
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     */
    generate(endianness = os.endianness()): MemorySlot {
        // Clean the private key cache only up to the upper bound bytes length
        this.privateKey.fill(0, this._upperBound.bytesLength)

        // Generate a random number of bytes that will represent the random private key
        const randomBytesLength = Math.ceil(
            Math.random() * (this._upperBound.bytesLength - this._lowerBound.bytesLength) + this._lowerBound.bytesLength
        )

        if (randomBytesLength > this._lowerBound.bytesLength || randomBytesLength < this._upperBound.bytesLength) {
            // Within (exclusive) the lower and upper bounds bytes length, no need to check or reject
            // It will always be within the bounds
        } else if (randomBytesLength === this._lowerBound.bytesLength) {
            // Equal to the lower bound bytes length
        } else {
            // Equal to the upper bound bytes length
        }

        return this.memorySlot
    }

    /**
     * A debugging method that prints the content of the private key cache in hexadecimal format.
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     */
    printPrivateKey(endianness = os.endianness()): void {
        const privateKeyHex = this.privateKey
            .toHexString(undefined, endianness)
            .replace(new RegExp(`.{${this.privateKey.length * 2}}`, "g"), "$& ")

        externalLogger.info(`Private key: ${privateKeyHex}`)
    }
}
