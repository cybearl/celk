import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"

/**
 * The `Sha256Algorithm` class is used to hash data coming from a
 * `Cache` instance at a certain position given by an input `MemorySlot`,
 * and rewrite the hash back to the `Cache` instance at another
 * position given by an output `MemorySlot`.
 */
export default class Sha256Algorithm {
    /** 64-bit words constants. */
    // prettier-ignore
    private readonly _K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);

    /**
     * Initial Hash Values (H) for SHA-256.
     * These are the first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19.
     */
    // prettier-ignore
    private readonly _H = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ])

    /** Reusable input array. */
    private _inputArray: number[] = []

    /** Reusable W array. */
    private _W = new Uint32Array(64)

    /** Perform the rotate right operation. */
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
     * SHA-256 internal hash computation.
     * @param cache The cache to write to.
     * @param length The input data length.
     * @param offset The offset to write to.
     */
    private _sha256 = (cache: Cache, length: number, offset: number): void => {
        const hash = this._H.slice()

        // Note from @noble/hashes:
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        let a
        let b
        let c
        let d
        let e
        let f
        let g
        let h
        let t1
        let t2
        let gamma0
        let gamma1

        const bitLength = length * 8

        // Append padding (Big Endian)
        this._inputArray[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32))
        this._inputArray[(((bitLength + 64) >>> 9) << 4) + 15] = bitLength

        for (let i = 0; i < 8; i += 16) {
            a = hash[0]
            b = hash[1]
            c = hash[2]
            d = hash[3]
            e = hash[4]
            f = hash[5]
            g = hash[6]
            h = hash[7]

            for (let j = 0; j < 64; j++) {
                if (j < 16) {
                    this._W[j] = this._inputArray[j + i]
                } else {
                    gamma0 = (this._gamma0(this._W[j - 15]) + this._W[j - 16]) | 0
                    gamma1 = (this._gamma1(this._W[j - 2]) + this._W[j - 7]) | 0
                    this._W[j] = (gamma0 + gamma1) | 0
                }

                t1 = (h + this._sigma1(e) + this._choose(e, f, g) + this._K[j] + this._W[j]) | 0
                t2 = (this._sigma0(a) + this._majority(a, b, c)) | 0

                // Update working variables
                h = g
                g = f
                f = e
                e = (d + t1) | 0
                d = c
                c = b
                b = a
                a = (t1 + t2) | 0
            }

            // Update hash values
            hash[0] = (hash[0] + a) | 0
            hash[1] = (hash[1] + b) | 0
            hash[2] = (hash[2] + c) | 0
            hash[3] = (hash[3] + d) | 0
            hash[4] = (hash[4] + e) | 0
            hash[5] = (hash[5] + f) | 0
            hash[6] = (hash[6] + g) | 0
            hash[7] = (hash[7] + h) | 0
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
     * Hashes the data from the `Cache` instance at a certain position,
     * and writes the hash back to the `Cache` instance at another position.
     *
     * Output Length: 32 bytes.
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    hash = (cache: Cache, inputSlot?: MemorySlot, outputSlot?: MemorySlot): void => {
        // Empty the input array by keeping the reference
        this._inputArray.length = 0

        const input = cache.subarray(inputSlot?.start, inputSlot?.length)
        this.cacheToBigEndianWords(input)
        this._sha256(cache, input.length, outputSlot?.start || 0)
    }
}
