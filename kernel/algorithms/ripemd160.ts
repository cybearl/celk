import { rotl32, safeAdd32, safeAdd32Many } from "#kernel/bitwise"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"

/**
 * The `Ripemd160Algorithm` class is used to hash data coming from a
 * `Cache` instance at a certain position given by an input `MemorySlot`,
 * and rewrite the hash back to the `Cache` instance at another
 * position given by an output `MemorySlot`.
 *
 * Sources:
 * - [Wikipedia](https://en.wikipedia.org/wiki/RIPEMD).
 * - [Original PDF](https://homes.esat.kuleuven.be/~bosselae/ripemd160/pdf/AB-9601/AB-9601.pdf).
 */
export default class Ripemd160Algorithm {
    /** Z-Left rotation constants. */
    // prettier-ignore
    private readonly _ZL = new Uint8Array([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
        3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
        1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
        4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
    ])

    /** Z-Right rotation constants. */
    // prettier-ignore
    private readonly _ZR = new Uint8Array([
        5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
        6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
        15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
        8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
        12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
    ])

    /** S-Left rotation constants. */
    // prettier-ignore
    private readonly _SL = new Uint8Array([
        11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
        7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
        11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
        11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
        9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
    ])

    /** S-Right rotation constants. */
    // prettier-ignore
    private readonly _SR = new Uint8Array([
        8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
        9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
        9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
        15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
        8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
    ])

    /**
     * Initial Hash Values (H) for RIPEMD-160.
     */
    private readonly _H = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0])

    /** Stores the last input padded data length. */
    private _lastLength = 0

    /** Reusable input array that stores the input data. */
    private _inputArray: Uint32Array = new Uint32Array(0)

    /** Temporary array to store the hash values. */
    private _hash = new Uint32Array(8)

    /**
     * Specific algorithm method: "f", required for RIPEMD-160 computation.
     */
    private _f = (j: number, x: number, y: number, z: number): number => {
        const res =
            0 <= j && j <= 15
                ? x ^ y ^ z
                : 16 <= j && j <= 31
                  ? (x & y) | (~x & z)
                  : 32 <= j && j <= 47
                    ? (x | ~y) ^ z
                    : 48 <= j && j <= 63
                      ? (x & z) | (y & ~z)
                      : x ^ (y | ~z) // 64 <= j && j <= 79

        return res
    }

    /**
     * Specific algorithm method: "k1", required for RIPEMD-160 computation.
     */
    private _k1 = (j: number): number => {
        const res =
            0 <= j && j <= 15
                ? 0x00000000
                : 16 <= j && j <= 31
                  ? 0x5a827999
                  : 32 <= j && j <= 47
                    ? 0x6ed9eba1
                    : 48 <= j && j <= 63
                      ? 0x8f1bbcdc
                      : 0xa953fd4e // 64 <= j && j <= 79

        return res
    }

    /**
     * Specific algorithm method: "k2", required for RIPEMD-160 computation.
     */
    private _k2 = (j: number): number => {
        const res =
            0 <= j && j <= 15
                ? 0x50a28be6
                : 16 <= j && j <= 31
                  ? 0x5c4dd124
                  : 32 <= j && j <= 47
                    ? 0x6d703ef3
                    : 48 <= j && j <= 63
                      ? 0x7a6d76e9
                      : 0x00000000 // 64 <= j && j <= 79

        return res
    }

    /**
     * RIPEMD-160 internal hash computation.
     * @param cache The cache to write to.
     * @param offset The offset to write to.
     */
    private _ripemd160 = (cache: Cache, offset: number): void => {
        // Set the initial hash values
        this._hash = this._H.slice()

        let al
        let bl
        let cl
        let dl
        let el
        let ar
        let br
        let cr
        let dr
        let er
        let t

        for (let i = 0; i < this._inputArray.length; i += 16) {
            al = ar = this._hash[0]
            bl = br = this._hash[1]
            cl = cr = this._hash[2]
            dl = dr = this._hash[3]
            el = er = this._hash[4]

            for (let j = 0; j < 80; j++) {
                // t = safeAdd(al, this._f(j, bl, cl, dl))
                // t = safeAdd(t, this._inputArray[i + this._ZL[j]])
                // t = safeAdd(t, this._k1(j))
                // t = safeAdd(rotl(t, this._SL[j]), el)

                t = safeAdd32Many(al, this._f(j, bl, cl, dl), this._inputArray[i + this._ZL[j]], this._k1(j))
                t = safeAdd32(rotl32(t, this._SL[j]), el)

                al = el
                el = dl
                dl = rotl32(cl, 10)
                cl = bl
                bl = t

                // t = safeAdd(ar, this._f(79 - j, br, cr, dr))
                // t = safeAdd(t, this._inputArray[i + this._ZR[j]])
                // t = safeAdd(t, this._k2(j))
                // t = safeAdd(rotl(t, this._SR[j]), er)

                t = safeAdd32Many(ar, this._f(79 - j, br, cr, dr), this._inputArray[i + this._ZR[j]], this._k2(j))
                t = safeAdd32(rotl32(t, this._SR[j]), er)

                ar = er
                er = dr
                dr = rotl32(cr, 10)
                cr = br
                br = t
            }

            // Update hash state
            t = safeAdd(this._hash[1], safeAdd(cl, dr))
            this._hash[1] = safeAdd(this._hash[2], safeAdd(dl, er))
            this._hash[2] = safeAdd(this._hash[3], safeAdd(el, ar))
            this._hash[3] = safeAdd(this._hash[4], safeAdd(al, br))
            this._hash[4] = safeAdd(this._hash[0], safeAdd(bl, cr))
            this._hash[0] = t
        }

        // Write to cache at offset
        cache.writeUint32Array(this._hash, offset, undefined, "LE")
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
            this._inputArray = new Uint32Array(totalLength >> 2)
        }

        // Note: no need to erase the data, if the length is the same, the data will be overwritten
        // and in the case of different lengths, the previous array will be garbage collected.

        // Copy the input data to the input array
        for (let i = 0; i < length; i += 4) {
            this._inputArray[i >> 2] = cache.readUint32LE((inputSlot?.start || 0) + i)
        }

        // Append padding bits and length
        this._inputArray[bitLength >> 5] |= 0x80 << bitLength % 32
        this._inputArray[(((bitLength + 64) >>> 9) << 4) + 14] = bitLength

        // Update the last length
        this._lastLength = length
    }

    /**
     * Hashes the data in the cache using the RIPEMD-160 algorithm,
     * rewriting the hash back to the cache at the specified offset.
     * - Output Length: 20 bytes.
     * - Supports only data with a length that is a multiple of 4 bytes.
     * @param cache The `Cache` instance to read the data from and write the hash to.
     * @param inputSlot The position of the data to read in the cache (optional, defaults to 0 => length).
     * @param outputSlot The position to write the hash to in the cache (optional, defaults to 0 => data length).
     */
    hash(cache: Cache, inputSlot?: MemorySlot, outputSlot?: MemorySlot): void {
        this._manageBlocks(cache, inputSlot)
        this._ripemd160(cache, outputSlot?.start || 0)
    }
}
