import { rotr32, safeAdd32, safeAdd32x4, safeAdd32x5 } from "#kernel/bitwise"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"

/**
 * The `Sha256Algorithm` class is used to hash data coming from a
 * `Cache` instance at a certain position given by an input `MemorySlot`,
 * and rewrite the hash back to the `Cache` instance at another
 * position given by an output `MemorySlot`.
 *
 * Sources:
 * - [Wikipedia](https://en.wikipedia.org/wiki/SHA-2).
 * - [Original PDF](https://helix.stormhub.org/papers/SHA-256.pdf).
 */
export default class Sha256Algorithm {
    /**
     * 64 binary words `K`.
     * Given by the 32 first bits of the fractional parts
     * of the cube roots of the first 64 prime numbers.
     */
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
     * These are the first 32 bits of the fractional part
     * of the square roots of the first 8 prime numbers.
     */
    // prettier-ignore
    private readonly _H = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ])

    /** Stores the last input padded data length. */
    private _lastLength = 0

    /** Reusable array that stores the input data. */
    private _block: Uint32Array = new Uint32Array(0)

    /** Reusable array to store the hash values. */
    private _hash = new Uint32Array(8)

    /** Reusable W array. */
    private _W = new Uint32Array(64)

    /** Perform the `_choose` operation. */
    private _choose = (x: number, y: number, z: number): number => (x & y) ^ (~x & z)

    /** Perform the `majority` operation. */
    private _majority = (x: number, y: number, z: number): number => (x & y) ^ (x & z) ^ (y & z)

    /** Perform the `SIGMA 0` operation. */
    private _sigma0 = (x: number): number => rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22)

    /** Perform the `SIGMA 1` operation. */
    private _sigma1 = (x: number): number => rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25)

    /** Perform the `GAMMA 0` operation. */
    private _gamma0 = (x: number): number => rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3)

    /** Perform the `GAMMA 1` operation. */
    private _gamma1 = (x: number): number => rotr32(x, 17) ^ rotr32(x, 19) ^ (x >>> 10)

    /**
     * SHA-256 internal hash computation.
     * @param cache The cache to write to.
     * @param offset The offset to write to.
     */
    private _sha256 = (cache: Cache, offset: number): void => {
        // Set the initial hash values
        this._hash = this._H.slice()

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

        // Working variables
        let T1
        let T2

        for (let i = 0; i < this._block.length; i += 16) {
            a = this._hash[0]
            b = this._hash[1]
            c = this._hash[2]
            d = this._hash[3]
            e = this._hash[4]
            f = this._hash[5]
            g = this._hash[6]
            h = this._hash[7]

            for (let j = 0; j < 64; j++) {
                if (j < 16) {
                    this._W[j] = this._block[j + i]
                } else {
                    this._W[j] = safeAdd32x4(
                        this._gamma0(this._W[j - 15]),
                        this._W[j - 16],
                        this._gamma1(this._W[j - 2]),
                        this._W[j - 7]
                    )
                }

                T1 = safeAdd32x5(h, this._sigma1(e), this._choose(e, f, g), this._K[j], this._W[j])
                T2 = safeAdd32(this._sigma0(a), this._majority(a, b, c))

                // Update working variables
                h = g
                g = f
                f = e
                e = safeAdd32(d, T1)
                d = c
                c = b
                b = a
                a = safeAdd32(T1, T2)
            }

            // Update hash state
            this._hash[0] = safeAdd32(a, this._hash[0])
            this._hash[1] = safeAdd32(b, this._hash[1])
            this._hash[2] = safeAdd32(c, this._hash[2])
            this._hash[3] = safeAdd32(d, this._hash[3])
            this._hash[4] = safeAdd32(e, this._hash[4])
            this._hash[5] = safeAdd32(f, this._hash[5])
            this._hash[6] = safeAdd32(g, this._hash[6])
            this._hash[7] = safeAdd32(h, this._hash[7])
        }

        // Write to cache at offset
        for (let i = 0; i < 8; i++) {
            cache.writeUint32BE(this._hash[i], offset + i * 4, false)
        }
    }

    /**
     * Either create a new `Uint32Array` or reuse the existing one by filling it with zeros,
     * then copy the input data to the input array, append padding bits, and append the length.
     *
     * The optimization strategy here, is to reuse the same array if the input data length is the same,
     * so, no need to allocate a new array every time so the algorithm becomes faster for same length inputs.
     * @param cache The cache to read the data from.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     */
    private _manageBlocks = (cache: Cache, inputSlot?: MemorySlot): void => {
        const length = inputSlot?.length || cache.length
        const bitLength = length * 8

        // Allocate a new array ONLY if the input data length is different
        if (this._lastLength !== length) {
            // Calculate the total length of the input data + 1 byte (0x80) + 8 bytes (length in bits)
            // and align it to 64 bytes with zeros
            const totalLength = length + 1 + 8 + (64 - ((length + 9) % 64))
            this._block = new Uint32Array(totalLength >> 2)
        }

        // Note: no need to erase the data, if the length is the same, the data will be overwritten
        // and in the case of different lengths, the previous array will be garbage collected.

        // Copy the input data to the block
        for (let i = 0; i < length; i += 4) {
            this._block[i >> 2] = cache.readUint32BE((inputSlot?.start || 0) + i)
        }

        // Append padding bits and length
        this._block[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32))
        this._block[(((bitLength + 64) >>> 9) << 4) + 15] = bitLength

        // Update the last length
        this._lastLength = length
    }

    /**
     * Hashes the data in the cache using the SHA-256 algorithm,
     * rewriting the hash back to the cache at the specified offset.
     * - Output Length: 32 bytes.
     * - Supports only data with a length that is a multiple of 4 bytes.
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    hash = (cache: Cache, inputSlot?: MemorySlot, outputSlot?: MemorySlot): void => {
        this._manageBlocks(cache, inputSlot)

        console.log(
            Buffer.from(this._block.buffer)
                .toString("hex")
                .match(/.{1,4}/g)
                ?.join(" ")
        )

        this._sha256(cache, outputSlot?.start || 0)
    }
}
