import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"

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
    private pool: Cache

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

        this.refill()
    }

    /**
     * Refills the pool with new random bytes.
     */
    private refill(): void {
        this.pool.randomFill()
        this.position = 0
    }

    /**
     * Reads a certain amount of random bytes from the pool
     * and returns the `MemorySlot` pointing to the read data.
     * @param length The amount of bytes to read.
     * @returns The `MemorySlot` pointing to the read data.
     */
    read(length: number): MemorySlot {
        if (this.position + length > this.size) {
            this.refill()
        }

        const slot = {
            start: this.position,
            length,
            end: this.position + length,
        }

        this.position += length

        return slot
    }
}
