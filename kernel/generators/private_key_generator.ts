import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import externalLogger from "#lib/utils/external_logger"
import logger from "@adonisjs/core/services/logger"
import { cyGeneral } from "@cybearl/cypack"
import os from "node:os"

/**
 * The type definition of the options for the `PrivateKeyGenerator` class.
 */
export type PrivateKeyGeneratorOptions = {
    privateKeySize?: number
    lowerBound?: bigint
    upperBound?: bigint
    poolSize?: number
    endianness?: "BE" | "LE"
}

/**
 * The default options for the `PrivateKeyGenerator` class.
 */
const defaultOptions: Required<PrivateKeyGeneratorOptions> = {
    privateKeySize: 32,
    lowerBound: 0n,
    upperBound: 2n ** 256n - 1n,
    poolSize: 1024,
    endianness: os.endianness(),
}

/**
 * The `PrivateKeyGenerator` class is used to generate a private key from a pool of random bytes.
 *
 * Note that the range of the private key is in bytes, not directly in numbers, which drastically
 * improves the performance of the generator, but also limits the precision of the range to be in
 * multiples of 8 bits.
 */
export default class PrivateKeyGenerator {
    /**
     * The pool of random bytes.
     */
    pool!: Cache

    /**
     * The size in of the private key to generate, represented in bytes.
     */
    private _privateKeySize!: number

    /**
     * The highest possible value of the private key based on its size.
     */
    private _maxValue!: bigint

    /**
     * The lower bound of the private key to generate, represented in bytes.
     */
    private _lowerBound!: Cache

    /**
     * The upper bound of the private key to generate, represented in bytes.
     */
    private _upperBound!: Cache

    /**
     * The current position in the pool.
     */
    private _position = 0

    /**
     * Creates a new `PrivateKeyGenerator` instance.
     * @param options The available options:
     * - privateKeySize The size of the private key to generate (optional, defaults to 32).
     * - lowerBound The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - upperBound The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - poolSize The size of the pool, must be a multiple of the private key size (optional, defaults to 1,024).
     * - endianness The endianness to use (optional, defaults to the platform's endianness).
     */
    constructor(options?: PrivateKeyGeneratorOptions) {
        this.setOptions(options)
    }

    /**
     * The memory slot that points to the currently requested bytes in the pool.
     */
    get memorySlot(): MemorySlot {
        return {
            start: this._position,
            length: this._privateKeySize,
            end: this._position + this._privateKeySize,
        }
    }

    /**
     * Converts both the lower and upper bounds of the private key to two `Cache` instances.
     * @param lowerBound The lower bound of the private key to generate.
     * @param upperBound The upper bound of the private key to generate.
     * @returns The lower and upper bounds of the private key as `Cache` instances.
     */
    private _getBounds(lowerBound: bigint, upperBound: bigint): { lowerBound: Cache; upperBound: Cache } {
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

        return { lowerBound: Cache.fromBigInt(lowerBound), upperBound: Cache.fromBigInt(upperBound) }
    }

    /**
     * Set the options for the private key generator.
     * @param options The available options:
     * - privateKeySize The size of the private key to generate (optional, defaults to 32).
     * - lowerBound The lower bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 0).
     * - upperBound The upper bound of the private key to generate rounded to
     *   the nearest byte (optional, defaults to 2^256 - 1).
     * - poolSize The size of the pool, must be a multiple of the private key size (optional, defaults to 1,024).
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

        if (options?.poolSize && options.poolSize % (options.privateKeySize ?? 32) !== 0) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_POOL_SIZE,
                    "The pool size must be a multiple of the private key size."
                )
            )
        }

        this._privateKeySize = options.privateKeySize ?? 32
        this._maxValue = 2n ** BigInt(this._privateKeySize * 8) - 1n

        const bounds = this._getBounds(options.lowerBound ?? 0n, options.upperBound ?? this._maxValue)
        this._lowerBound = bounds.lowerBound
        this._upperBound = bounds.upperBound

        this.pool = new Cache(options.poolSize ?? 1024)
        this.refill(options.endianness)
    }

    /**
     * Refills the pool with new random bytes based on the private key bounds,
     * not that, while this method is really fast, it does not guarantee that the
     * private key will be within the bounds, but it is highly probable.
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     */
    refill(endianness = os.endianness()): void {
        this.pool.clear()

        for (let i = 0; i < this.pool.length; i += this._privateKeySize) {
            let lowerLimit = this._lowerBound[endianness === "LE" ? this._upperBound.length - 1 : 0] ?? 0x00
            let upperLimit = this._upperBound[endianness === "LE" ? this._upperBound.length - 1 : 0] ?? 0xff

            for (let j = 0; j < this._upperBound.length; j++) {
                const randomByte = Math.floor(Math.random() * (upperLimit - lowerLimit + 1) + lowerLimit)

                if (endianness === "LE") this.pool[i + j] = randomByte
                else this.pool[i + this._privateKeySize - j - 1] = randomByte

                if (randomByte > lowerLimit) lowerLimit = 0x00
                else lowerLimit = this._lowerBound[endianness === "LE" ? this._upperBound.length - j - 1 : j] ?? 0x00

                if (randomByte < upperLimit) upperLimit = 0xff
                else upperLimit = this._upperBound[endianness === "LE" ? this._upperBound.length - j - 1 : j] ?? 0xff
            }
        }

        this._position = 0
        this.print(endianness)
    }

    /**
     * Generates a new private key and returns the memory slot pointing to it.
     * @returns The memory slot pointing to the generated private key.
     */
    generate(): MemorySlot {
        this._position += this._privateKeySize
        if (this._position + this._privateKeySize > this.pool.length) this.refill()

        return this.memorySlot
    }

    /**
     * A debugging method that prints the pool of random bytes.
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     */
    print(endianness = os.endianness()): void {
        const poolHex = this.pool
            .toHexString(undefined, endianness)
            .replace(new RegExp(`.{${this._privateKeySize * 2}}`, "g"), "$& ")

        externalLogger.info(`Pool: ${poolHex}`)
    }
}
