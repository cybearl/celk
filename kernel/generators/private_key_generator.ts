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
    maxRejections?: number
    throwOnMaxRejections?: boolean
}

/**
 * The default options for the `PrivateKeyGenerator` class.
 */
export const defaultPrivateKeyGeneratorOptions: Required<PrivateKeyGeneratorOptions> = {
    privateKeySize: 32,
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
     * @param options The available options:
     * - privateKeySize The size of the private key to generate (optional, defaults to 32).
     * - lowerBound The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - upperBound The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - endianness The endianness to use (optional, defaults to the platform's endianness).
     * - maxRejections The maximum number of bounds rejections before throwing an error (optional, defaults to 1,000,000,
     *   set to -1 to disable the limit).
     * - throwOnMaxRejections A flag indicating if an error should be thrown when the maximum number of rejections is
     *   reached, if not, it will just return the private key outside the bounds (optional, defaults to true).
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
     * - maxRejections The maximum number of bounds rejections before throwing an error (optional, defaults to 1,000,000,
     *   set to -1 to disable the limit).
     * - throwOnMaxRejections A flag indicating if an error should be thrown when the maximum number of rejections is
     *   reached, if not, it will just return the private key outside the bounds (optional, defaults to true).
     */
    setOptions(options: PrivateKeyGeneratorOptions = defaultPrivateKeyGeneratorOptions): void {
        if (options?.privateKeySize && options.privateKeySize <= 0) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_LENGTH,
                    "The private key size must be greater than 0."
                )
            )
        }

        this.privateKey = new Cache(options?.privateKeySize ?? defaultPrivateKeyGeneratorOptions.privateKeySize)
        this._maxValue = 2n ** BigInt(this.privateKey.length * 8) - 1n

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

        this._endianness = this.privateKey.normalizeEndianness(
            options.endianness ?? defaultPrivateKeyGeneratorOptions.endianness
        )

        this.generate()
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
                const randomByte = this.privateKey.readUint8(i)

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
                const randomByte = this.privateKey.readUint8(i)

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
    generate(): MemorySlot {
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
                    return this.memorySlot
                }
            }

            // Generate a random number of bytes that will represent the random private key
            const randomBytesLength = Math.round(
                Math.random() * (this._upperBound.bytesLength - this._lowerBound.bytesLength) +
                    this._lowerBound.bytesLength
            )

            // Clean and refill the private key with random bytes
            if (this._endianness === "LE") {
                this.privateKey.clear(0, this._upperBound.bytesLength)
                this.privateKey.randomFill(0, randomBytesLength)
            } else {
                this.privateKey.clear(
                    this.privateKey.length - this._upperBound.bytesLength,
                    this._upperBound.bytesLength
                )
                this.privateKey.randomFill(this.privateKey.length - randomBytesLength, randomBytesLength)
            }

            isWithinBounds = this._isWithinBounds(randomBytesLength)
            if (!isWithinBounds) rejections++
        }

        return this.memorySlot
    }

    /**
     * A debugging method that prints the content of the private key cache
     * in hexadecimal format.
     */
    printPrivateKey(): void {
        const privateKeyHex = this.privateKey
            .toHexString(undefined, this._endianness)
            .replace(new RegExp(`.{${this.privateKey.length * 2}}`, "g"), "$& ")

        externalLogger.info(`Private key: ${privateKeyHex}`)
    }
}
