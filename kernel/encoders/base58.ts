import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"

/**
 * The `Base58Encoder` class is used to encode data coming from a
 * `Cache` instance to a Base58 string based on the current encoding.
 *
 * It also provides methods to decode Base58 strings back to
 * their bytecode and write them directly in a `Cache` instance
 * at a certain position given by a `MemorySlot` object.
 *
 * More info about the Base58 encoding can be found at:
 * - [Wiki](https://en.bitcoin.it/wiki/Base58Check_encoding).
 * - [YouTube Video](https://www.youtube.com/watch?v=GedV3S9X89c).
 * - [Medium](https://medium.com/concerning-pharo/understanding-base58-encoding-23e673e37ff6).
 * - [learnmeabitcoin](https://learnmeabitcoin.com/technical/keys/base58/).
 */
export default class Base58Encoder {
    private readonly _BASE = 58
    private readonly _CHARSET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

    /**
     * Creates a new `Base58Encoder` instance.
     */
    constructor() {}

    /**
     * Encodes a string into a Base58 encoded string.
     * @param cache The `Cache` instance to read the data from.
     * @param slot The position of the data in the cache (optional, defaults to 0 => length).
     * @returns The Base58 encoded string.
     */
    encode(cache: Cache, slot?: MemorySlot): string {
        const bytes = cache.readUint8Array(slot?.start ?? 0, slot?.length ?? cache.length)
        const indexes = [0]

        for (const byte of bytes) {
            // Shift all indexes by 8 bits
            for (let i = 0; i < indexes.length; i++) {
                indexes[i] <<= 8
            }

            // Add the byte to the first index
            indexes[0] += byte

            // Carry over the indexes
            let carry = 0

            for (let i = 0; i < indexes.length; i++) {
                indexes[i] += carry
                carry = (indexes[i] / this._BASE) | 0
                indexes[i] %= this._BASE
            }

            // Add the carry to the indexes
            while (carry) {
                indexes.push(carry % this._BASE)
                carry = (carry / this._BASE) | 0
            }
        }

        // Add leading 1s
        for (const byte of bytes) {
            if (byte !== 0) break
            indexes.push(0)
        }

        return indexes
            .reverse()
            .map((index) => this._CHARSET[index])
            .join("")
    }

    /**
     * Decodes a Base58 encoded string back to its original string.
     * @param base58String The Base58 string to decode.
     * @param cache The `Cache` instance to write the data to.
     * @param slot The position of the data in the cache (optional, defaults to 0 => data length).
     * @returns The decoded data as an Uint8Array (and writes it to the cache at the given slot).
     * @throws An error if the Base58 string is invalid.
     */
    decode(base58String: string, cache: Cache, slot?: MemorySlot): Uint8Array {
        const bytes = [0]

        for (const char of base58String) {
            // Get the index of the character in the charset
            const index = this._CHARSET.indexOf(char)

            if (index === -1) throw new Error(cyGeneral.errors.stringifyError(KernelErrors.INVALID_BASE58_CHARACTER))

            // Multiply all bytes by 58
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] *= this._BASE
            }

            // Add the index to the first byte
            bytes[0] += index

            // Carry over the bytes
            let carry = 0

            for (let i = 0; i < bytes.length; i++) {
                bytes[i] += carry
                carry = bytes[i] >> 8
                bytes[i] &= 0xff
            }

            // Add the carry to the bytes
            while (carry) {
                bytes.push(carry & 0xff)
                carry >>= 8
            }
        }

        // Add leading 0s
        for (let i = 0; i < base58String.length - 1; i++) {
            if (base58String[i] !== "1") break
            bytes.push(0)
        }

        // Write the bytes to the cache
        for (let i = 0; i < bytes.length; i++) {
            cache.writeUint8(bytes[bytes.length - i - 1], (slot?.start ?? 0) + i)
        }

        return new Uint8Array(bytes)
    }
}
