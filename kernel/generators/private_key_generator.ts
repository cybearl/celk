import Cache from "#kernel/utils/cache"
import { MemorySlotWithCacheInstance } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import externalLogger from "#lib/utils/external_logger"
import { cyGeneral } from "@cybearl/cypack"
import os from "node:os"

/**
 * The type definition of the options for the `PrivateKeyGenerator` class.
 */
export type PrivateKeyGeneratorOptions = {
    lowerBound?: bigint
    upperBound?: bigint
    endianness?: "BE" | "LE"
    maxRejections?: number
    throwOnMaxRejections?: boolean
}

/**
 * The default options for the `PrivateKeyGenerator` class.
 */
export const defaultPrivateKeyGeneratorOptions: Required<PrivateKeyGeneratorOptions> = {
    lowerBound: 1n,
    upperBound: 2n ** 256n - 1n,
    endianness: os.endianness(),
    maxRejections: 1_000_000,
    throwOnMaxRejections: true,
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
     * The output slot with cache instance passed to the generator.
     */
    private _outputSlotWithCacheInstance!: MemorySlotWithCacheInstance

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
     * The normalized endianness to use.
     */
    private _endianness!: "BE" | "LE"

    /**
     * The maximum number of bounds rejections before throwing an error.
     */
    private _maxRejections!: number

    /**
     * Whether to throw an error when the maximum number of rejections is reached.
     */
    private _throwOnMaxRejections!: boolean

    /**
     * Creates a new `PrivateKeyGenerator` instance.
     * @param outputSlotWithCacheInstance The cache instance to write the private key to, and its dedicated memory slot (optional, defaults to 0 => data length).
     * @param options The private key generator options:
     * - `lowerBound`: The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 1).
     * - `upperBound`: The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - `endianness`: The endianness to use (optional, defaults to the platform's endianness).
     * - `maxRejections`: The maximum number of bounds rejections before throwing an error (optional, defaults to 1,000,000,
     *   set to -1 to disable the limit).
     * - `throwOnMaxRejections`: A flag indicating if an error should be thrown when the maximum number of rejections is
     *   reached, if not, it will just return the private key outside the bounds (optional, defaults to true).
     */
    constructor(outputSlotWithCacheInstance: MemorySlotWithCacheInstance, options?: PrivateKeyGeneratorOptions) {
        this.setCacheInstanceWithSlot(outputSlotWithCacheInstance)
        this.setOptions(options ?? defaultPrivateKeyGeneratorOptions)
        this.generate()
    }

    /**
     * Set the output slot with cache instance to write the private key to.
     * @param outputSlotWithCacheInstance The cache instance to write the private key to, and its dedicated memory slot.
     */
    setCacheInstanceWithSlot(outputSlotWithCacheInstance: MemorySlotWithCacheInstance): void {
        if (outputSlotWithCacheInstance.cache.length <= 0) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_LENGTH,
                    "The private key size must be greater than 0.",
                    {
                        length: outputSlotWithCacheInstance.cache.length,
                    }
                )
            )
        }

        this._outputSlotWithCacheInstance = outputSlotWithCacheInstance

        // Initially clear the entire cache's memory slot
        this._outputSlotWithCacheInstance.cache.clear(
            this._outputSlotWithCacheInstance.start,
            this._outputSlotWithCacheInstance.length
        )

        // Calculate the maximum value of the private key based on its size
        this._maxValue = 2n ** BigInt(this._outputSlotWithCacheInstance.cache.length * 8) - 1n
    }

    /**
     * Verify and set the new bounds for the private key generator.
     */
    private _verifyAndSetBounds(lowerBound: bigint, upperBound: bigint): void {
        if (lowerBound < 0n) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The lower bound must be greater than or equal to 0.",
                    {
                        lowerBound: lowerBound,
                    }
                )
            )
        }

        if (upperBound < 1n) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be greater than or equal to 1.",
                    {
                        upperBound: upperBound,
                    }
                )
            )
        }

        if (upperBound <= lowerBound) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be greater than the lower bound.",
                    {
                        lowerBound: lowerBound,
                        upperBound: upperBound,
                    }
                )
            )
        }

        if (upperBound > this._maxValue) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be less than or equal to the maximum value of the private key based on its size.",
                    {
                        upperBound: upperBound,
                        maxValue: this._maxValue,
                    }
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
    }

    /**
     * Set the options for the private key generator.
     * @param options The private key generator options:
     * - `lowerBound`: The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - `upperBound`: The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - `endianness`: The endianness to use (optional, defaults to the platform's endianness).
     * - `maxRejections`: The maximum number of bounds rejections before throwing an error (optional, defaults to 1,000,000,
     *   set to -1 to disable the limit).
     * - `throwOnMaxRejections`: A flag indicating if an error should be thrown when the maximum number of rejections is
     *   reached, if not, it will just return the private key outside the bounds (optional, defaults to true).
     */
    setOptions(options: PrivateKeyGeneratorOptions): void {
        if (options.lowerBound || options.upperBound) {
            this._verifyAndSetBounds(options.lowerBound ?? 0n, options.upperBound ?? this._maxValue)
        }

        if (options.endianness) {
            this._endianness = this._outputSlotWithCacheInstance.cache.normalizeEndianness(options.endianness)
        }

        if (options.maxRejections !== undefined) {
            if (options.maxRejections < -1) {
                throw new Error(
                    cyGeneral.errors.stringifyError(
                        KernelErrors.INVALID_MAX_REJECTION_THRESHOLD,
                        "The maximum number of rejections must be greater than (> 0) or equal to -1.",
                        {
                            maxRejections: options.maxRejections,
                        }
                    )
                )
            }

            if (options.maxRejections === 0) {
                throw new Error(
                    cyGeneral.errors.stringifyError(
                        KernelErrors.INVALID_MAX_REJECTION_THRESHOLD,
                        "The maximum number of rejections must be greater than 0.",
                        {
                            maxRejections: options.maxRejections,
                        }
                    )
                )
            }

            this._maxRejections = options.maxRejections
        }

        if (options.throwOnMaxRejections !== undefined) {
            this._throwOnMaxRejections = options.throwOnMaxRejections
        }

        // Clear the entire cache's memory slot to prevent any conflict / contamination
        this._outputSlotWithCacheInstance.cache.clear(
            this._outputSlotWithCacheInstance.start,
            this._outputSlotWithCacheInstance.length
        )
    }

    /**
     * Returns information about the private key generator:
     * - `minByteSize`: The minimum size of the private key in bytes.
     * - `maxByteSize`: The maximum size of the private key in bytes.
     */
    get info() {
        return {
            minByteSize: this._lowerBound.bytesLength,
            maxByteSize: this._upperBound.bytesLength,
        }
    }

    /**
     * Checks if the random private key is within the bounds.
     * @param randomBytesLength The number of random bytes generated.
     */
    private _isWithinBounds(randomBytesLength: number): boolean {
        let isWithinBounds = true

        if (randomBytesLength === this._lowerBound.bytesLength) {
            // Compare each byte of the random private key with the lower bound with a flag
            // indicating if the random private key is greater than the lower bound
            for (let i = 0; i < this._lowerBound.bytesLength; i++) {
                const lowerBoundByte = this._lowerBound.value.readUint8(i)
                const randomByte = this._outputSlotWithCacheInstance.cache.readUint8(i)

                if (randomByte < lowerBoundByte) {
                    isWithinBounds = false
                    break
                }
            }
        }

        if (randomBytesLength === this._upperBound.bytesLength) {
            // Compare each byte of the random private key with the upper bound with a flag
            // indicating if the random private key is less than the upper bound
            for (let i = 0; i < this._upperBound.bytesLength; i++) {
                const upperBoundByte = this._upperBound.value.readUint8(i)
                const randomByte = this._outputSlotWithCacheInstance.cache.readUint8(i)

                if (randomByte > upperBoundByte) {
                    isWithinBounds = false
                    break
                }
            }
        }

        return isWithinBounds
    }

    /**
     * Generates a new private key following the bounds set in the options, using the
     * principle of rejection sampling based on a random number of bytes between the needed
     * number of bytes for the lower and upper bounds.
     */
    generate(): void {
        let isWithinBounds = false
        let rejections = 0

        // Generate the private key until it is within the bounds
        while (!isWithinBounds) {
            if (this._maxRejections !== -1 && rejections >= this._maxRejections) {
                if (this._throwOnMaxRejections) {
                    throw new Error(
                        cyGeneral.errors.stringifyError(
                            KernelErrors.PRIVATE_KEY_GENERATION_FAILED,
                            "The private key generation failed due to too many rejections."
                        )
                    )
                } else {
                    // If not throwing, just accept the private key outside the bounds
                    break
                }
            }

            // Generate a random number of bytes that will represent the random private key
            const randomBytesLength = Math.round(
                Math.random() * (this._upperBound.bytesLength - this._lowerBound.bytesLength) +
                    this._lowerBound.bytesLength
            )

            // Clean and refill the private key with random bytes
            if (this._endianness === "LE") {
                this._outputSlotWithCacheInstance.cache.clear(0, this._upperBound.bytesLength)
                this._outputSlotWithCacheInstance.cache.randomFill(0, randomBytesLength)
            } else {
                this._outputSlotWithCacheInstance.cache.clear(
                    this._outputSlotWithCacheInstance.cache.length - this._upperBound.bytesLength,
                    this._upperBound.bytesLength
                )
                this._outputSlotWithCacheInstance.cache.randomFill(
                    this._outputSlotWithCacheInstance.cache.length - randomBytesLength,
                    randomBytesLength
                )
            }

            isWithinBounds = this._isWithinBounds(randomBytesLength)
            if (!isWithinBounds) rejections++
        }
    }

    /**
     * A debugging method that prints the content of the private key cache
     * in hexadecimal format.
     */
    printPrivateKey(): void {
        const privateKeyHex = this._outputSlotWithCacheInstance.cache
            .toHexString(undefined, this._endianness)
            .replace(new RegExp(`.{${this._outputSlotWithCacheInstance.cache.length * 2}}`, "g"), "$& ")

        externalLogger.info(`Private key: ${privateKeyHex}`)
    }
}
