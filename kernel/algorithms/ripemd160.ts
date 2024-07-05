import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"

/**
 * A TypeScript implementation of the RACE Integrity Primitives Evaluation Message Digest,
 * RIPEMD-160, as defined in "The hash function RIPEMD-160".
 *
 * More info about the RIPEMD-160 algorithm can be found at:
 * - [The hash function RIPEMD-160](https://homes.esat.kuleuven.be/~bosselae/ripemd160.html).
 * - [A Strengthened Version of RIPEMD](https://homes.esat.kuleuven.be/~bosselae/ripemd160/pdf/AB-9601/AB-9601.pdf).
 * - [TS implementation by Paul Miller](https://github.com/paulmillr/noble-hashes/blob/main/src/ripemd160.ts).
 */
export default class Ripemd160Algorithm {
    private readonly _R1 = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3,
        10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0,
        5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
    ]
    private readonly _R2 = [
        5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15,
        5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15,
        10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
    ]
    private readonly _S1 = [
        11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
        11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
        9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
    ]
    private readonly _S2 = [
        8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
        9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
        8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
    ]

    /**
     * Initial Hash Values (H) for RIPEMD-160.
     */
    private readonly _H = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0])

    /** Reusable input array. */
    private _inputArray: number[] = []

    /**
     * Perform the "circular shift left" (CSL) operation, needed for the hash computation.
     * @param x The number to shift.
     * @param n The number of bits to shift.
     * @returns The shifted number.
     */
    private _CSL = (x: number, n: number): number => (x << n) | (x >>> (32 - n))

    /**
     * Specific algorithm method: "F", required for RIPEMD-160 computation.
     */
    private _F = (j: number, x: number, y: number, z: number): number => {
        const res =
            0 <= j && j <= 15
                ? x ^ y ^ z
                : 16 <= j && j <= 31
                  ? (x & y) | (~x & z)
                  : 32 <= j && j <= 47
                    ? (x | ~y) ^ z
                    : 48 <= j && j <= 63
                      ? (x & z) | (y & ~z)
                      : 64 <= j && j <= 79
                        ? x ^ (y | ~z)
                        : "ERROR"

        if (res === "ERROR") {
            throw new Error("[Ripemd160Algorithm] F: j is out of range")
        }

        return res
    }

    /**
     * Specific algorithm method: "K1", required for RIPEMD-160 computation.
     */
    private _K1 = (j: number): number => {
        const res =
            0 <= j && j <= 15
                ? 0x00000000
                : 16 <= j && j <= 31
                  ? 0x5a827999
                  : 32 <= j && j <= 47
                    ? 0x6ed9eba1
                    : 48 <= j && j <= 63
                      ? 0x8f1bbcdc
                      : 64 <= j && j <= 79
                        ? 0xa953fd4e
                        : "ERROR"

        if (res === "ERROR") {
            throw new Error("[Ripemd160Algorithm] K1: j is out of range")
        }

        return res
    }

    /**
     * Specific algorithm method: "K2", required for RIPEMD-160 computation.
     */
    private _K2 = (j: number): number => {
        const res =
            0 <= j && j <= 15
                ? 0x50a28be6
                : 16 <= j && j <= 31
                  ? 0x5c4dd124
                  : 32 <= j && j <= 47
                    ? 0x6d703ef3
                    : 48 <= j && j <= 63
                      ? 0x7a6d76e9
                      : 64 <= j && j <= 79
                        ? 0x00000000
                        : "ERROR"

        if (res === "ERROR") {
            throw new Error("[Ripemd160Algorithm] K2: j is out of range")
        }

        return res
    }

    /**
     * Safe addition operation, needed for the hash computation.
     * @param x The first number to add.
     * @param y The second number to add.
     * @returns The sum of the two numbers.
     */
    private _safeAdd = (x: number, y: number): number => {
        const lsw = (x & 0xffff) + (y & 0xffff)
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16)

        return (msw << 16) | (lsw & 0xffff)
    }

    /**
     * RIPEMD-160 internal hash computation.
     * @param cache The cache to write to.
     * @param length The input data length.
     * @param offset The offset to write to.
     */
    private _ripemd160 = (cache: Cache, length: number, offset: number): void => {
        const space = new Uint32Array(10)
        const hash = this._H.slice()

        const l = length * 8
        let t

        // Append padding (Little Endian)
        this._inputArray[l >> 5] |= 0x80 << l % 32
        this._inputArray[(((l + 64) >>> 9) << 4) + 14] = l

        for (let i = 0; i < this._inputArray.length; i += 16) {
            space.set(hash)
            space.set(hash, 5)

            for (let j = 0; j < 80; j++) {
                t = this._safeAdd(space[0], this._F(j, space[1], space[2], space[3]))
                t = this._safeAdd(t, this._inputArray[i + this._R1[j]])
                t = this._safeAdd(t, this._K1(j))
                t = this._safeAdd(this._CSL(t, this._S1[j]), space[4])

                space[0] = space[4]
                space[4] = space[3]
                space[3] = this._CSL(space[2], 10)
                space[2] = space[1]
                space[1] = t

                t = this._safeAdd(space[5], this._F(79 - j, space[6], space[7], space[8]))
                t = this._safeAdd(t, this._inputArray[i + this._R2[j]])
                t = this._safeAdd(t, this._K2(j))
                t = this._safeAdd(this._CSL(t, this._S2[j]), space[9])

                space[5] = space[9]
                space[9] = space[8]
                space[8] = this._CSL(space[7], 10)
                space[7] = space[6]
                space[6] = t
            }

            t = this._safeAdd(hash[1], this._safeAdd(space[2], space[8]))
            hash[1] = this._safeAdd(hash[2], this._safeAdd(space[3], space[9]))
            hash[2] = this._safeAdd(hash[3], this._safeAdd(space[4], space[5]))
            hash[3] = this._safeAdd(hash[4], this._safeAdd(space[0], space[6]))
            hash[4] = this._safeAdd(hash[0], this._safeAdd(space[1], space[7]))
            hash[0] = t
        }

        // Write to cache at offset
        cache.writeUint32Array(hash, offset, undefined, "LE")
    }

    /**
     * Converts an input cache to an array of little-endian words
     * using the predefined input array as an output
     * @param cache The input cache.
     */
    private cacheToLittleEndianWords = (cache: Cache): void => {
        for (let i = 0; i < cache.length * 8; i += 8) {
            // Write the byte to the word
            this._inputArray[i >> 5] |= (cache[i / 8] & 0xff) << i % 32
        }
    }

    /**
     * Execute the RIPEMD-160 algorithm.
     * @param cache The cache to use (input & output).
     * @param inputSlot The memory slot to read from.
     * @param outputSlot The memory slot to write to.
     */
    execute = (cache: Cache, inputSlot: MemorySlot, outputSlot: MemorySlot): void => {
        // Empty the input array by keeping the reference
        this._inputArray.length = 0

        const input = cache.subarray(inputSlot.start, inputSlot.end)
        this.cacheToLittleEndianWords(input)
        this._ripemd160(cache, input.length, outputSlot.start)
    }
}
