import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"

/**
 * The type definition of the options for the `PrivateKeyGenerator` class.
 */
type Options = {
    privateKeySize?: number
    lowerBound?: bigint | number
    upperBound?: bigint | number
    poolSize?: number
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
    private readonly _pool: Cache

    /**
     * The size in of the private key to generate, represented in bytes.
     */
    private readonly _privateKeySize: number

    /**
     * The highest possible value of the private key based on its size.
     */
    private readonly _maxValue: bigint

    /**
     * The lower bound of the private key to generate, represented in bytes.
     */
    readonly _lowerBound: Cache

    /**
     * The upper bound of the private key to generate, represented in bytes.
     */
    readonly _upperBound: Cache

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
     * - poolSize The size of the pool (optional, defaults to 1,024).
     */
    constructor(options?: Options) {
        this._pool = new Cache(options?.poolSize ?? 1024)

        this._privateKeySize = options?.privateKeySize ?? 32
        this._maxValue = 2n ** BigInt(this._privateKeySize * 8) - 1n
        ;[this._lowerBound, this._upperBound] = this._getBounds(options?.lowerBound, options?.upperBound)

        console.log(this._lowerBound.toHexString())
        console.log(this._upperBound.toHexString())

        this._refill()
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
    private _getBounds(
        lowerBound: bigint | number | undefined,
        upperBound: bigint | number | undefined
    ): [Cache, Cache] {
        if (lowerBound && lowerBound < 0n) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The lower bound must be greater than or equal to 0."
                )
            )
        }

        if (upperBound && upperBound < 0n) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be greater than or equal to 0."
                )
            )
        }

        if (upperBound && lowerBound && BigInt(upperBound) < BigInt(lowerBound)) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be greater than or equal to the lower bound."
                )
            )
        }

        if (upperBound && BigInt(upperBound) > this._maxValue) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_PRIVATE_KEY_RANGE,
                    "The upper bound must be less than or equal to the maximum value of the private key based on its size."
                )
            )
        }

        // Converts lower and upper bounds to hex strings
        const lowerHex = lowerBound ? BigInt(lowerBound).toString(16) : "00"
        const upperHex = upperBound ? BigInt(upperBound).toString(16) : this._maxValue.toString(16)

        return [
            Cache.fromHexString(lowerHex.padStart(this._privateKeySize * 2, "0")),
            Cache.fromHexString(upperHex.padStart(this._privateKeySize * 2, "0")),
        ]
    }

    /**
     * Refills the pool with new random bytes while padding it with 0s to respect the bounds of
     * the private key.
     * @param mode Whether to fill the left or right side of the pool first, and pad the
     * other side with 0s (optional, defaults to `right`).
     */
    private _refill(mode: "left" | "right" = "right"): void {
        for (let i = 0; i < this._pool.length; i += this._privateKeySize) {
            for (let j = 0; j < this._privateKeySize; j++) {
                if (mode === "right" && i + j >= this._pool.length) break

                if (this._position + j >= this._lowerBound.length && this._position + j <= this._upperBound.length) {
                    this._pool[i + j] = this._lowerBound[i + j]
                } else {
                    this._pool[i + j] = cyGeneral.crypto.randomBytes(1)[0]
                }
            }
        }

        this._position = 0
    }

    /**
     * Generates a new private key and returns the memory slot pointing to it.
     * @returns The memory slot pointing to the generated private key.
     */
    generate(): MemorySlot {
        this._position += this._privateKeySize
        if (this._position + this._privateKeySize > this._pool.length) this._refill()

        console.log(this._pool.toHexString())

        return this.memorySlot
    }
}
