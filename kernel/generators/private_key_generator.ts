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
    injectedHexPrivateKey?: string
    lowerBound?: bigint
    upperBound?: bigint
    endianness?: "BE" | "LE"
    maxRejections?: number
    throwOnMaxRejections?: boolean
}

/**
 * The default options for the `PrivateKeyGenerator` class.
 */
export const defaultPrivateKeyGeneratorOptions: Required<Omit<PrivateKeyGeneratorOptions, "injectedHexPrivateKey">> = {
    lowerBound: 0n,
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
     * The hexadecimal representation of the private key to inject (optional, used for testing).
     */
    private _injectedHexPrivateKey?: string

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
     * - `injectedHexPrivateKey` The hexadecimal representation of the private key to inject (optional, used for testing).
     * - `lowerBound` The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - `upperBound` The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - `endianness` The endianness to use (optional, defaults to the platform's endianness).
     * - `maxRejections` The maximum number of bounds rejections before throwing an error (optional, defaults to 1,000,000,
     *   set to -1 to disable the limit).
     * - `throwOnMaxRejections` A flag indicating if an error should be thrown when the maximum number of rejections is
     *   reached, if not, it will just return the private key outside the bounds (optional, defaults to true).
     */
    constructor(outputSlotWithCacheInstance: MemorySlotWithCacheInstance, options?: PrivateKeyGeneratorOptions) {
        this.setParams(outputSlotWithCacheInstance, options)
    }

    /**
     * Set the options for the private key generator.
     * @param outputSlotWithCacheInstance The cache instance to write the private key to, and its dedicated memory slot (optional, defaults to 0 => data length).
     * @param options The private key generator options:
     * - `injectedHexPrivateKey` The hexadecimal representation of the private key to inject (optional, used for testing).
     * - `lowerBound` The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - `upperBound` The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - `endianness` The endianness to use (optional, defaults to the platform's endianness).
     * - `maxRejections` The maximum number of bounds rejections before throwing an error (optional, defaults to 1,000,000,
     *   set to -1 to disable the limit).
     * - `throwOnMaxRejections` A flag indicating if an error should be thrown when the maximum number of rejections is
     *   reached, if not, it will just return the private key outside the bounds (optional, defaults to true).
     */
    setParams(
        outputSlotWithCacheInstance: MemorySlotWithCacheInstance,
        options: PrivateKeyGeneratorOptions = defaultPrivateKeyGeneratorOptions
    ): void {
        if (outputSlotWithCacheInstance.cache.length <= 0) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_LENGTH,
                    "The private key size must be greater than 0."
                )
            )
        }

        this._outputSlotWithCacheInstance = outputSlotWithCacheInstance
        this._injectedHexPrivateKey = options.injectedHexPrivateKey
        this._maxValue = 2n ** BigInt(this._outputSlotWithCacheInstance.cache.length * 8) - 1n
        this._maxRejections = options.maxRejections ?? defaultPrivateKeyGeneratorOptions.maxRejections
        this._throwOnMaxRejections =
            options.throwOnMaxRejections ?? defaultPrivateKeyGeneratorOptions.throwOnMaxRejections

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

        this._endianness = this._outputSlotWithCacheInstance.cache.normalizeEndianness(
            options.endianness ?? defaultPrivateKeyGeneratorOptions.endianness
        )

        if (!options.injectedHexPrivateKey) this.generate()
        else this.useInjectedHexPrivateKey()
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
     * Injects a private key into the cache instead of generating a new one, useful for testing,
     * uses the `injectedHexPrivateKey` option.
     */
    useInjectedHexPrivateKey(): void {
        if (!this._injectedHexPrivateKey) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_INJECTED_PRIVATE_KEY,
                    "The injected private key is missing."
                )
            )
        }

        this._outputSlotWithCacheInstance.cache.writeHexString(
            this._injectedHexPrivateKey,
            this._outputSlotWithCacheInstance.start,
            (this._outputSlotWithCacheInstance.length ?? 0) * 2 // In characters, 2 per byte
        )
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
