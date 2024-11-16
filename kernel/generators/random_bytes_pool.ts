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
    pool: Cache

    /**
     * The size of the pool.
     */
    private size: number

    /**
     * The current position in the pool.
     */
    private position: number

    /**
     * Creates a new `RandomBytesPool` instance with a certain size.
     * @param size The size of the pool.
     */
    constructor(size: number) {
        this.pool = new Cache(size)
        this.size = size
        this.position = 0

        this._refill()
    }

    /**
     * Refills the pool with new random bytes.
     */
    private _refill(): void {
        this.pool.randomFill()
        this.position = 0
    }

    /**
     * Increments the position in the pool by a certain amount and returns the
     * corresponding memory slot.
     * @param amount The amount of bytes to increment the position by.
     * @returns The memory slot pointing to the requested bytes.
     */
    increment(amount: number): MemorySlot {
        if (this.position + amount > this.size) this._refill()
        this.position += amount

        return {
            start: this.position,
            length: amount,
            end: this.position + amount,
        }
    }
}
