import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"

/**
 * A TypeScript implementation of the Secure Hash Algorithm, SHA-256, as defined in FIPS 180-4.
 *
 * More info about SHA-256 algorithm can be found at:
 * - [Explanation by Quadibloc](http://www.quadibloc.com/crypto/mi060501.htm).
 * - [JS implementation by Bryan Chow](https://gist.github.com/bryanchow/1649353).
 */
export default class Sha256Algorithm {
    /** 64-bit words constants. */
    private readonly _K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
        0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
        0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
        0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
        0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
        0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ])

    /**
     * Initial Hash Values (H) for SHA-256.
     */
    private readonly _H = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ])

    /** Reusable input array. */
    private _inputArray: number[] = []

    /** Reusable W array. */
    private _W = new Uint32Array(64)

    /** Perform the rotate right operation (named `rotr` in FIPS 180-4). */
    private _rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n))

    /** Perform the `_choose` operation. */
    private _choose = (x: number, y: number, z: number): number => (x & y) ^ (~x & z)

    /** Perform the `majority` operation. */
    private _majority = (x: number, y: number, z: number): number => (x & y) ^ (x & z) ^ (y & z)

    /** Perform the `SIGMA 0` operation. */
    private _sigma0 = (x: number): number => this._rotr(x, 2) ^ this._rotr(x, 13) ^ this._rotr(x, 22)

    /** Perform the `SIGMA 1` operation. */
    private _sigma1 = (x: number): number => this._rotr(x, 6) ^ this._rotr(x, 11) ^ this._rotr(x, 25)

    /** Perform the `GAMMA 0` operation. */
    private _gamma0 = (x: number): number => this._rotr(x, 7) ^ this._rotr(x, 18) ^ (x >>> 3)

    /** Perform the `GAMMA 1` operation. */
    private _gamma1 = (x: number): number => this._rotr(x, 17) ^ this._rotr(x, 19) ^ (x >>> 10)

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
     * SHA-256 internal hash computation.
     * @param cache The cache to write to.
     * @param input The input cache to use.
     * @param offset The offset to write to.
     */
    private _sha256 = (cache: Cache, input: Cache, offset: number): void => {
        const store = new Uint32Array(8)
        const hash = this._H

        const l = input.length * 8
        let t1
        let t2

        // Append padding (Big Endian)
        this._inputArray[l >> 5] |= 0x80 << (24 - (l % 32))
        this._inputArray[(((l + 64) >>> 9) << 4) + 15] = l

        for (let i = 0; i < this._inputArray.length; i += 16) {
            store.set(hash)

            for (let j = 0; j < 64; j++) {
                if (j < 16) {
                    this._W[j] = this._inputArray[j + i]
                } else {
                    this._W[j] = this._safeAdd(
                        this._safeAdd(
                            this._safeAdd(this._gamma1(this._W[j - 2]), this._W[j - 7]),
                            this._gamma0(this._W[j - 15])
                        ),
                        this._W[j - 16]
                    )
                }

                t1 = this._safeAdd(
                    this._safeAdd(
                        this._safeAdd(
                            this._safeAdd(store[7], this._sigma1(store[4])),
                            this._choose(store[4], store[5], store[6])
                        ),
                        this._K[j]
                    ),
                    this._W[j]
                )

                t2 = this._safeAdd(this._sigma0(store[0]), this._majority(store[0], store[1], store[2]))

                // Update working variables
                store[7] = store[6]
                store[6] = store[5]
                store[5] = store[4]
                store[4] = this._safeAdd(store[3], t1)
                store[3] = store[2]
                store[2] = store[1]
                store[1] = store[0]
                store[0] = this._safeAdd(t1, t2)
            }

            for (let k = 0; k < 8; k++) {
                hash[k] = this._safeAdd(store[k], hash[k])
            }
        }

        // Write to cache at offset
        cache.writeUint32Array(hash, offset, undefined, "BE")
    }

    /**
     * Converts an input cache to an array of big endian words
     * using the predefined input array as an output.
     * @param cache The input cache.
     */
    private cacheToBigEndianWords = (cache: Cache): void => {
        for (let i = 0; i < cache.length * 8; i += 8) {
            // Write the byte to the word
            this._inputArray[i >> 5] |= (cache[i / 8] & 0xff) << (24 - (i % 32))
        }
    }

    /**
     * Execute the SHA-256 algorithm.
     * @param cache The cache to use (input & output).
     * @param inputSlot The memory slot to read from.
     * @param outputSlot The memory slot to write to.
     */
    execute = (cache: Cache, inputSlot: MemorySlot, outputSlot: MemorySlot): void => {
        // Empty the input array by keeping the reference
        this._inputArray.length = 0

        const input = cache.subarray(inputSlot.start, inputSlot.end)
        this.cacheToBigEndianWords(input)
        this._sha256(cache, input, outputSlot.start)
    }
}
