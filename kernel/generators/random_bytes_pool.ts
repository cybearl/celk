import Cache from "#kernel/utils/cache"

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
    size: number

    /**
     * The current position in the pool.
     */
    position: number

    /**
     * The latest amount of bytes requested from the pool.
     */
    latestAmount: number

    /**
     * Creates a new `RandomBytesPool` instance with a certain size.
     * @param size The size of the pool.
     */
    constructor(size: number) {
        this.pool = new Cache(size)
        this.size = size
        this.position = 0
        this.latestAmount = 0

        this._refill()
    }

    /**
     * Refills the pool with new random bytes.
     */
    _refill(): void {
        this.pool.randomFill()
        this.position = 0
    }

    /**
     * Increments the position in the pool by a certain amount.
     * @param amount The amount of bytes to increment the position by.
     */
    increment(amount: number) {
        this.position += amount
        this.latestAmount = amount

        if (this.position + amount > this.size) this._refill()
    }
}
