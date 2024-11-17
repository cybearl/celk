import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"

/**
 * The `RandomBytesPool` class is used to generate a pool of random bytes used for different generation
 * processes.
 *
 * Each time a certain amount of bytes is requested, it is read from the pool until it is empty,
 * then it is refilled with new random bytes.
 */
export default class RandomBytesPool {
    /**
     * The pool of random bytes.
     */
    readonly pool: Cache

    /**
     * The size of the pool.
     */
    private readonly _size: number

    /**
     * The current position in the pool.
     */
    private _position: number

    /**
     * The latest amount of bytes requested from the pool.
     */
    private _latestAmount: number

    /**
     * Creates a new `RandomBytesPool` instance with a certain size.
     * @param size The size of the pool.
     */
    constructor(size: number) {
        this.pool = new Cache(size)
        this._size = size
        this._position = 0
        this._latestAmount = 0

        this._refill()
    }

    /**
     * Refills the pool with new random bytes.
     */
    _refill(): void {
        this.pool.safeRandomFill()
        this._position = 0
    }

    /**
     * Increments the position in the pool by a certain amount.
     * @param amount The amount of bytes to increment the position by.
     */
    increment(amount: number) {
        this._position += amount
        this._latestAmount = amount
        if (this._position + amount > this._size) this._refill()
    }

    /**
     * The memory slot that points to the currently requested bytes in the pool.
     */
    get memorySlot(): MemorySlot {
        return {
            start: this._position,
            length: this._latestAmount,
            end: this._position + this._latestAmount,
        }
    }
}
