import { randomFillSync } from "node:crypto"
import os from "node:os"

/**
 * A type for a single bit (`0` or `1`).
 */
export type Bit = 0 | 1

/**
 * Cache is a helper class that extends the Uint8Array class with additional methods
 * similar to the Buffer class in Node.js, while also providing multiple utility methods
 * linked to advanced cryptography and binary data manipulation.
 *
 * **Notes:**
 * - As TypedArrays are based on the platform's endianness, the `littleEndian` parameter
 * is potentially inverted before being used, allowing support for both Little Endian and Big Endian systems.
 */
export default class Cache extends Uint8Array {
    /**
     * The initial offset of the cache compared to the buffer's `byteOffset`.
     */
    private _offset = 0

    /**
     * The length of the cache (in bytes).
     */
    private _length: number

    /**
     * The platform's endianness which all related methods will use by default.
     */
    readonly platformEndianness = os.endianness()

    /**
     * Whether the buffer is shared or not.
     */
    readonly isBufferShared = this.buffer instanceof SharedArrayBuffer

    /**
     * The number of bytes per element in the cache (always 1).
     */
    readonly BYTES_PER_ELEMENT = 1

    /**
     * Creates a new Cache object based on a length or an input (supported by the Uint8Array constructor).
     * @param length The length of the cache to create.
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     * @param options The options to use (optional).
     * - `buffer`: The buffer to feed to the Uint8Array constructor.
     * - `offset`: The offset to start reading from (optional, defaults to 0).
     * - `length`: The length to read (optional, defaults to the input length).
     */
    constructor(
        length: number,
        options?: {
            buffer: ArrayBufferLike
            offset?: number
            length?: number
        }
    ) {
        if (length < 0) throw new RangeError(`[Cache - constructor] Invalid cache length: '${length}'.`)

        if (!options) super(length)
        else super(options.buffer, options?.offset, options?.length)

        this._offset = options?.offset ?? 0
        this._length = options?.length ?? length
    }

    /**
     * =========
     *  GETTERS
     * =========
     */

    /**
     * The ArrayBuffer instance referenced by the cache.
     */
    get buffer(): ArrayBuffer {
        return super.buffer
    }

    /**
     * The initial offset of the cache compared to the buffer's `byteOffset`.
     */
    get byteOffset(): number {
        return super.byteOffset
    }

    /**
     * The initial offset of the cache compared to the buffer's `byteOffset`.
     */
    get offset(): number {
        return this._offset
    }

    /**
     * The byte length of the cache.
     */
    get byteLength(): number {
        return super.byteLength
    }

    /**
     * The byte length of the cache.
     */
    get length(): number {
        return this._length
    }

    /**
     * =================
     *  GENERAL METHODS
     * =================
     */

    /**
     * Checks the offset and length for validity.
     *
     * **Note:** This method is used internally by the read/write methods.
     * @param offset The offset to check.
     * @param length The length to check.
     * @throws If the offset or length are invalid.
     */
    check = (offset: number, length: number): void => {
        if (Number.isNaN(offset) || Number.isNaN(length)) {
            throw new TypeError(`[Cache - check] Invalid offset: '${offset}' or length: '${length}'.`)
        }
        if (offset < 0 || offset >= this.length) {
            throw new RangeError(`[Cache - check] Invalid offset: '${offset}', it must be >= 0 & < ${this.length}.`)
        }
        if (length < 1 || length > this.length) {
            throw new RangeError(`[Cache - check] Invalid length: '${length}', it must be > 0 & <= ${this.length}.`)
        }
        if (offset + length > this.length) {
            throw new RangeError(
                `[Cache - check] Invalid offset (${offset}) + length (${length}): '${offset + length}', it must be <= ${this.length}.`
            )
        }

        if (offset % 1 !== 0) throw new RangeError(`[Cache - check] Invalid offset alignment: '${offset}'.`)
        if (length % 1 !== 0) throw new RangeError(`[Cache - check] Invalid length alignment: '${length}'.`)
    }

    /**
     * Normalizes the endianness parameter.
     *
     * By default, the cache is written for Little Endian, so if the platform is big endian,
     * the endianness parameter is inverted.
     *
     * - Little endian platform:
     *   - `LE` read from left to right.
     *   - `BE` read from right to left.
     * - Big endian platform:
     *   - `LE` read from right to left.
     *   - `BE` read from left to right.
     */
    normalizeEndianness = (endianness: "LE" | "BE"): "LE" | "BE" => {
        if (this.platformEndianness === "BE") {
            if (endianness === "LE") return "BE"
            return "LE"
        }

        return endianness
    };

    /**
     * ===========
     *  ITERATORS
     * ===========
     */

    /**
     * The symbol iterator of the cache, allowing to iterate over the cache
     * using `for..of` loops and returning bytes.
     * @returns A new Iterator object.
     */
    *[Symbol.iterator]() {
        for (let i = 0; i < this.length; i++) {
            yield this[i]
        }
    }

    /**
     * This method returns a new Iterator object for iterating over index-value pairs,
     * returning an array with the index and the byte.
     * @returns A new Iterator object.
     */
    entries = (): IterableIterator<[number, number]> => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        let index = 0

        return {
            next(): IteratorResult<[number, number]> {
                if (index < self.length) {
                    return {
                        done: false,
                        value: [index++, self[index - 1]],
                    }
                } else {
                    return { done: true, value: undefined }
                }
            },
            [Symbol.iterator](): IterableIterator<[number, number]> {
                return this
            },
        }
    }

    /**
     * ================
     *  STATIC METHODS
     * ================
     */

    /**
     * Creates a new Cache object of the specified length, initially filled with zeros.
     * @param length The length of the cache.
     * @param sharedBuffer Whether to use a `SharedArrayBuffer` (optional, defaults to true).
     * @returns A new Cache object.
     */
    static alloc = (length: number, sharedBuffer = true): Cache => {
        if (sharedBuffer) {
            const buffer = new SharedArrayBuffer(length)
            return new Cache(length, { buffer })
        }

        return new Cache(length)
    }

    /**
     * Creates a new Cache object from an hexadecimal string (supports `0x` prefix).
     * @param value The hexadecimal string to create the cache from.
     * @returns A new Cache object.
     */
    static fromHexString = (value: string): Cache => {
        // Remove any `0x` prefix before writing
        if (value.startsWith("0x")) value = value.slice(2)

        const cache = new Cache(Math.ceil(value.length / 2))
        cache.writeHexString(value, 0, value.length)
        return cache
    }

    /**
     * Creates a new Cache object from an UTF-8 string.
     * @param value The UTF-8 string to create the cache from.
     * @returns A new Cache object.
     */
    static fromUtf8String = (value: string): Cache => {
        const cache = new Cache(value.length)
        cache.writeUtf8String(value, 0, value.length)
        return cache
    }

    /**
     * Creates a new Cache object from an array of bits.
     * @param array The array of bits to create the cache from.
     * @param msbFirst Whether to write the bits from the most significant bit (optional, defaults to true).
     * @returns A new Cache object.
     */
    static fromBits = (array: Bit[], msbFirst = true): Cache => {
        const cache = new Cache(Math.ceil(array.length / 8))
        cache.writeBits(array, 0, array.length, msbFirst)
        return cache
    }

    /**
     * Creates a new Cache object from a Uint8Array.
     * @param array The Uint8Array to create the cache from.
     * @returns A new Cache object.
     */
    static fromUint8Array = (array: Uint8Array): Cache => {
        const cache = new Cache(array.length)
        cache.writeUint8Array(array, 0, array.length)
        return cache
    }

    /**
     * Creates a new Cache object from a Uint16Array.
     * @param array The Uint16Array to create the cache from.
     * @returns A new Cache object.
     */
    static fromUint16Array = (array: Uint16Array): Cache => {
        const cache = new Cache(array.length * 2)
        cache.writeUint16Array(array, 0, array.length)
        return cache
    }

    /**
     * Creates a new Cache object from a Uint32Array.
     * @param array The Uint32Array to create the cache from.
     * @returns A new Cache object.
     */
    static fromUint32Array = (array: Uint32Array): Cache => {
        const cache = new Cache(array.length * 4)
        cache.writeUint32Array(array, 0, array.length)
        return cache
    }

    /**
     * ===============
     *  WRITE METHODS
     * ===============
     */

    /**
     * Writes an hexadecimal string to the cache (supports `0x` prefix).
     * @param value The hexadecimal string to write to the cache.
     * @param offset The offset to start writing at (optional, defaults to 0).
     * @param length The length to write (optional, defaults to the value length).
     * @returns The cache instance.
     */
    writeHexString = (value: string, offset = 0, length = value.length): this => {
        if (value.length === 0) {
            throw new RangeError(`[Cache - writeHexString] Invalid hexadecimal string length: '${value.length}'.`)
        }
        if (value.length % 2 !== 0) {
            throw new RangeError(`[Cache - writeHexString] Invalid hexadecimal string length: '${value.length}'.`)
        }

        // Remove any `0x` prefix before writing
        if (value.startsWith("0x")) {
            value = value.slice(2)
            length -= 2
        }

        this.check(offset, Math.ceil(length / 2))

        for (let i = 0; i < length; i += 2) {
            const highNibble = value.charCodeAt(i) | 0x20 // Convert to lowercase for A-F
            const lowNibble = value.charCodeAt(i + 1) | 0x20 // Convert to lowercase for A-F

            // Converts the pair of hexadecimal characters to a byte
            this[offset + i / 2] =
                ((highNibble - (highNibble > 57 ? 87 : 48)) << 4) | (lowNibble - (lowNibble > 57 ? 87 : 48))
        }

        return this
    }

    /**
     * Writes an UTF-8 string to the cache.
     * @param value The UTF-8 string to write to the cache.
     * @param offset The offset to start writing at (optional, defaults to 0).
     * @param length The length to write (optional, defaults to the value length).
     * @returns The cache instance.
     */
    writeUtf8String = (value: string, offset = 0, length = value.length): this => {
        if (value.length === 0) {
            throw new RangeError(`[Cache - writeUtf8String] Invalid UTF-8 string length: '${value.length}'.`)
        }

        this.check(offset, length)

        for (let i = 0; i < length; i++) this[offset + i] = value.charCodeAt(i)
        return this
    }

    /**
     * Writes a single bit to the cache.
     *
     * **Note:** The offset is in bits, not bytes in contrast to the other methods.
     * @param value The value to write (`0` or `1`).
     * @param offset The offset to read from **as a number of bits** (optional, defaults to 0).
     * @param msbFirst Whether to write the bit to the most significant bit (optional, defaults to true).
     * @returns The cache instance.
     */
    writeBit = (value: Bit, offset = 0, msbFirst = true): this => {
        if (value < 0 || value > 1) throw new RangeError(`[Cache - writeBit] Value is out of bounds: '${value}'.`)

        const byteOffset = Math.floor(offset / 8)
        this.check(byteOffset, 1)

        const bitOffset = msbFirst ? 7 - (offset % 8) : offset % 8
        if (value === 1) this[byteOffset] |= 1 << bitOffset
        else this[byteOffset] &= ~(1 << bitOffset)

        return this
    }

    /**
     * Writes a single byte to the cache.
     * @param value The value to write.
     * @param offset The offset to write to (optional, defaults to 0).
     * @returns The cache instance.
     */
    writeUint8 = (value: number, offset = 0): this => {
        if (value < 0 || value > 0xff) throw new RangeError(`[Cache - writeUint8] Value is out of bounds: '${value}'.`)
        this.check(offset, 1)

        value >>>= 0
        this[offset] = value

        return this
    }

    /**
     * **[LITTLE ENDIAN]** Writes a single 16-bit value to the cache.
     *
     * **Should be aligned to 2 bytes.**
     * @param value The value to write.
     * @param byteOffset The byte offset to write to (optional, defaults to 0).
     * @returns The cache instance.
     */
    writeUint16LE = (value: number, byteOffset = 0): this => {
        if (value < 0 || value > 0xffff) {
            throw new RangeError(`[Cache - writeUint16LE] Value is out of bounds: '${value}'.`)
        }
        if (byteOffset % 2 !== 0) {
            throw new RangeError(`[Cache - writeUint16LE] Invalid byte offset alignment: '${byteOffset}' (%2).`)
        }

        this.check(byteOffset, 2)

        value >>>= 0
        this[byteOffset] = value & 0xff
        this[byteOffset + 1] = (value >> 8) & 0xff

        return this
    }

    /**
     * **[BIG ENDIAN]** Writes a single 16-bit value to the cache.
     *
     * **Should be aligned to 2 bytes.**
     * @param value The value to write.
     * @param byteOffset The byte offset to write to (optional, defaults to 0).
     * @returns The cache instance.
     */
    writeUint16BE = (value: number, byteOffset = 0): this => {
        if (value < 0 || value > 0xffff) {
            throw new RangeError(`[Cache - writeUint16BE] Value is out of bounds: '${value}'.`)
        }
        if (byteOffset % 2 !== 0) {
            throw new RangeError(`[Cache - writeUint16BE] Invalid byte offset alignment: '${byteOffset}' (%2).`)
        }

        this.check(byteOffset, 2)

        value >>>= 0
        this[byteOffset] = (value >> 8) & 0xff
        this[byteOffset + 1] = value & 0xff

        return this
    }

    /**
     * Writes a single 16-bit value to the cache.
     *
     * **Should be aligned to 2 bytes.**
     * @param value The value to write.
     * @param byteOffset The byte offset to write to (optional, defaults to 0).
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     * @returns The cache instance.
     */
    writeUint16 = (value: number, byteOffset = 0, endianness = this.platformEndianness): this => {
        if (this.normalizeEndianness(endianness) === "LE") this.writeUint16LE(value, byteOffset)
        else this.writeUint16BE(value, byteOffset)

        return this
    }

    /**
     * **[LITTLE ENDIAN]** Writes a single 32-bit word to the cache.
     *
     * **Should be aligned to 4 bytes.**
     * @param value The value to write.
     * @param byteOffset The byte offset to write to (optional, defaults to 0).
     * @returns The cache instance.
     */
    writeUint32LE = (value: number, byteOffset = 0): this => {
        if (value < 0 || value > 0xffffffff) {
            throw new RangeError(`[Cache - writeUint32LE] Value is out of bounds: '${value}'.`)
        }
        if (byteOffset % 4 !== 0) {
            throw new RangeError(`[Cache - writeUint32LE] Invalid byte offset alignment: '${byteOffset}' (%4).`)
        }

        this.check(byteOffset, 4)

        value >>>= 0
        this[byteOffset] = value & 0xff
        this[byteOffset + 1] = (value >> 8) & 0xff
        this[byteOffset + 2] = (value >> 16) & 0xff
        this[byteOffset + 3] = (value >> 24) & 0xff

        return this
    }

    /**
     * **[BIG ENDIAN]** Writes a single 32-bit word to the cache.
     *
     * **Should be aligned to 4 bytes.**
     * @param value The value to write.
     * @param byteOffset The byte offset to write to (optional, defaults to 0).
     * @returns The cache instance.
     */
    writeUint32BE = (value: number, byteOffset = 0): this => {
        if (value < 0 || value > 0xffffffff) {
            throw new RangeError(`[Cache - writeUint32BE] Value is out of bounds: '${value}'.`)
        }
        if (byteOffset % 4 !== 0) {
            throw new RangeError(`[Cache - writeUint32BE] Invalid byte offset alignment: '${byteOffset}' (%4).`)
        }

        this.check(byteOffset, 4)

        value >>>= 0
        this[byteOffset] = (value >> 24) & 0xff
        this[byteOffset + 1] = (value >> 16) & 0xff
        this[byteOffset + 2] = (value >> 8) & 0xff
        this[byteOffset + 3] = value & 0xff

        return this
    }

    /**
     * Writes a single 32-bit word to the cache.
     *
     * **Should be aligned to 4 bytes.**
     * @param value The value to write.
     * @param byteOffset The byte offset to write to (optional, defaults to 0).
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     * @returns The cache instance.
     */
    writeUint32 = (value: number, byteOffset = 0, endianness = this.platformEndianness): this => {
        if (this.normalizeEndianness(endianness) === "LE") this.writeUint32LE(value, byteOffset)
        else this.writeUint32BE(value, byteOffset)

        return this
    }

    /**
     * Writes an array of bits to the cache.
     *
     * **Note:** The offset is in bits, not bytes in contrast to the other methods,
     * same thing for the length.
     * @param array The array of bits to write to the cache.
     * @param offset The offset to start writing at **as a number of bits** (optional, defaults to 0).
     * @param length The length to write **as a number of bits** (optional, defaults to the array length).
     * @param msbFirst Whether to write the bits from the most significant bit (optional, defaults to true).
     * @returns The cache instance.
     */
    writeBits = (array: Bit[], offset = 0, length = array.length, msbFirst = true): this => {
        if (!array || !Array.isArray(array)) {
            throw new TypeError(`[Cache - writeBits] Invalid array of bits: '${array}'.`)
        }

        const byteOffset = Math.floor(offset / 8)
        const byteLength = Math.ceil(length / 8)
        this.check(byteOffset, byteLength)

        for (let i = 0; i < length; i++) this.writeBit(array[i], offset + i, msbFirst)

        return this
    }

    /**
     * Writes a Uint8Array to the cache.
     * @param array The Uint8Array to write to the cache.
     * @param offset The offset to start writing at (optional, defaults to 0).
     * @param length The length to write (optional, defaults to the array length).
     * @returns The cache instance.
     */
    writeUint8Array = (array: Uint8Array, offset = 0, length = array.length): this => {
        if (!array || !(array instanceof Uint8Array)) {
            throw new TypeError(`[Cache - writeUint8Array] Invalid Uint8Array: '${array}'.`)
        }

        this.check(offset, length)

        for (let i = 0; i < length; i++) this[offset + i] = array[i]

        return this
    }

    /**
     * Writes a Uint16Array to the cache.
     *
     * **Should be aligned to 2 bytes.**
     * @param array The Uint16Array to write to the cache.
     * @param byteOffset The byte offset to start writing at (optional, defaults to 0).
     * @param byteLength The byte length to write (optional, defaults to the array byte length).
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     * @returns The cache instance.
     */
    writeUint16Array = (
        array: Uint16Array,
        byteOffset = 0,
        byteLength = array.byteLength,
        endianness = this.platformEndianness
    ): this => {
        if (!array || !(array instanceof Uint16Array)) {
            throw new TypeError(`[Cache - writeUint16Array] Invalid Uint16Array: '${array}'.`)
        }
        if (byteOffset % 2 !== 0) {
            throw new RangeError(`[Cache - writeUint16Array] Invalid byte offset alignment: '${byteOffset}' (%2).`)
        }

        this.check(byteOffset, byteLength)

        if (this.normalizeEndianness(endianness) === "LE") {
            for (let i = 0; i < byteLength; i += 2) this.writeUint16LE(array[i / 2], byteOffset + i)
        } else {
            for (let i = 0; i < byteLength; i += 2) this.writeUint16BE(array[i / 2], byteOffset + i)
        }

        return this
    }

    /**
     * Writes a Uint32Array to the cache.
     *
     * **Should be aligned to 4 bytes.**
     * @param array The Uint32Array to write to the cache.
     * @param byteOffset The byte offset to start writing at (optional, defaults to 0).
     * @param byteLength The byte length to write (optional, defaults to the array byte length).
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     * @returns The cache instance.
     */
    writeUint32Array = (
        array: Uint32Array,
        byteOffset = 0,
        byteLength = array.byteLength,
        endianness = this.platformEndianness
    ): this => {
        if (!array || !(array instanceof Uint32Array)) {
            throw new TypeError(`[Cache - writeUint32Array] Invalid Uint32Array: '${array}'.`)
        }
        if (byteOffset % 4 !== 0) {
            throw new RangeError(`[Cache - writeUint32Array] Invalid byte offset alignment: '${byteOffset}' (%4).`)
        }

        this.check(byteOffset, byteLength)

        if (this.normalizeEndianness(endianness) === "LE") {
            for (let i = 0; i < byteLength; i += 4) this.writeUint32LE(array[i / 4], byteOffset + i)
        } else {
            for (let i = 0; i < byteLength; i += 4) this.writeUint32BE(array[i / 4], byteOffset + i)
        }

        return this
    }

    /**
     * **[LITTLE ENDIAN]** Writes a big integer of any size to the cache.
     *
     * **No alignment is required, the length is automatically calculated.**
     * @param value The big integer to write to the cache.
     * @param offset The offset to start writing at (optional, defaults to 0).
     * @param length The length to write (optional, defaults to the value length).
     * @returns The cache instance.
     */
    writeBigIntLE = (value: bigint, offset = 0, length = Math.ceil(Number(value).toString(16).length / 2)): this => {
        if (value < 0n) throw new RangeError(`[Cache - writeBigIntLE] Invalid big integer value: '${value}'.`)
        this.check(offset, length)

        for (let i = 0; i < length; i++) {
            this[offset + i] = Number(value & BigInt(0xff))
            value >>= BigInt(8)
        }

        return this
    }

    /**
     * **[BIG ENDIAN]** Writes a big integer of any size to the cache.
     *
     * **No alignment is required, the length is automatically calculated.**
     * @param value The big integer to write to the cache.
     * @param offset The offset to start writing at (optional, defaults to 0).
     * @param length The length to write (optional, defaults to the value length).
     * @returns The cache instance.
     */
    writeBigIntBE = (value: bigint, offset = 0, length = Math.ceil(Number(value).toString(16).length / 2)): this => {
        if (value < 0n) throw new RangeError(`[Cache - writeBigIntBE] Invalid big integer value: '${value}'.`)
        this.check(offset, length)

        for (let i = length - 1; i >= 0; i--) {
            this[offset + i] = Number(value & BigInt(0xff))
            value >>= BigInt(8)
        }

        return this
    }

    /**
     * Writes a big integer of any size to the cache.
     *
     * **No alignment is required, the length is automatically calculated.**
     * @param value The big integer to write to the cache.
     * @param offset The offset to start writing at (optional, defaults to 0).
     * @param length The length to write (optional, defaults to the value length).
     * @param endianness The endianness to use (optional, defaults to the platform's endianness).
     * @returns The cache instance.
     */
    writeBigInt = (
        value: bigint,
        offset = 0,
        length = Math.ceil(Number(value).toString(16).length / 2),
        endianness = this.platformEndianness
    ): this => {
        if (this.normalizeEndianness(endianness) === "LE") this.writeBigIntLE(value, offset, length)
        else this.writeBigIntBE(value, offset, length)

        return this
    }

    /**
     * ==============
     *  READ METHODS
     * ==============
     */

    /**
     * Reads a part of the cache and returns it as an hexadecimal string (always uppercase)
     * @param offset The offset to start reading from (optional, defaults to 0).
     * @param length The length to read (optional, defaults to the cache length - offset).
     * @returns The hexadecimal string.
     */
    readHexString = (offset = 0, length = this.length - offset): string => {
        this.check(offset, length)
        return Buffer.from(this.buffer, offset, length).toString("hex").toUpperCase()
    }

    /**
     * Reads a part of the cache and returns it as an UTF-8 string.
     * @param offset The offset to start reading from (optional, defaults to 0).
     * @param length The length to read (optional, defaults to the cache length - offset).
     * @returns The UTF-8 string.
     */
    readUtf8String = (offset = 0, length = this.length - offset): string => {
        this.check(offset, length)
        return Buffer.from(this.buffer, offset, length).toString("utf8")
    }

    /**
     * Read a single bit from the cache.
     *
     * **Note:** The offset is in bits, not bytes in contrast to the other methods.
     * @param offset The offset to read from **as a number of bits** (optional, defaults to 0).
     * @param msbFirst Whether to read the bit from the most significant bit (optional, defaults to true).
     * @returns The bit as 0 or 1.
     * @throws If the offset is invalid.
     */
    readBit = (offset = 0, msbFirst = true): Bit => {
        const byteOffset = Math.floor(offset / 8)
        this.check(byteOffset, 1)

        const bitOffset = msbFirst ? 7 - (offset % 8) : offset % 8
        return (this[byteOffset] & (1 << bitOffset)) !== 0 ? 1 : 0
    }

    /**
     * Reads a single byte from the cache.
     *
     * Equivalent to using the index signature (square bracket notation).
     * @param offset The offset to read from (optional, defaults to 0).
     * @returns The byte as number.
     */
    readUint8 = (offset = 0): number => {
        this.check(offset, 1)
        return this[offset]
    }

    /**
     * **[LITTLE ENDIAN]** Reads a single 16-bit value from the cache.
     *
     * **Should be aligned to 2 bytes.**
     * @param byteOffset The byte offset to read from (optional, defaults to 0).
     * @returns The 16-bit value.
     */
    readUint16LE = (byteOffset = 0): number => {
        if (byteOffset % 2 !== 0) {
            throw new RangeError(`[Cache - readUint16LE] Invalid byte offset alignment: '${byteOffset}' (%2).`)
        }

        this.check(byteOffset, 2)

        return (this[byteOffset] | (this[byteOffset + 1] << 8)) >>> 0
    }

    /**
     * **[BIG ENDIAN]** Reads a single 16-bit value from the cache.
     *
     * **Should be aligned to 2 bytes.**
     * @param byteOffset The byte offset to read from (optional, defaults to 0).
     * @returns The 16-bit value.
     */
    readUint16BE = (byteOffset = 0): number => {
        if (byteOffset % 2 !== 0) {
            throw new RangeError(`[Cache - readUint16BE] Invalid byte offset alignment: '${byteOffset}' (%2).`)
        }

        this.check(byteOffset, 2)

        return ((this[byteOffset] << 8) | this[byteOffset + 1]) >>> 0
    }

    /**
     * Reads a single 16-bit value from the cache.
     *
     * **Should be aligned to 2 bytes.**
     * @param byteOffset The byte offset to read from (optional, defaults to 0).
     * @param endianness Whether to read the value in Little Endian (optional, defaults to false).
     * @returns The 16-bit value.
     */
    readUint16 = (byteOffset = 0, endianness = this.platformEndianness): number => {
        if (this.normalizeEndianness(endianness) === "LE") return this.readUint16LE(byteOffset)
        return this.readUint16BE(byteOffset)
    }

    /**
     * **[LITTLE ENDIAN]** Reads a single 32-bit word from the cache.
     *
     * **Should be aligned to 4 bytes.**
     * @param byteOffset The byte offset to read from (optional, defaults to 0).
     */
    readUint32LE = (byteOffset = 0): number => {
        if (byteOffset % 4 !== 0) {
            throw new RangeError(`[Cache - readUint32LE] Invalid byte offset alignment: '${byteOffset}' (%4).`)
        }

        this.check(byteOffset, 4)

        return (
            (this[byteOffset] |
                (this[byteOffset + 1] << 8) |
                (this[byteOffset + 2] << 16) |
                (this[byteOffset + 3] << 24)) >>>
            0
        )
    }

    /**
     * **[BIG ENDIAN]** Reads a single 32-bit word from the cache.
     *
     * **Should be aligned to 4 bytes.**
     * @param byteOffset The byte offset to read from (optional, defaults to 0).
     */
    readUint32BE = (byteOffset = 0): number => {
        if (byteOffset % 4 !== 0) {
            throw new RangeError(`[Cache - readUint32BE] Invalid byte offset alignment: '${byteOffset}' (%4).`)
        }

        this.check(byteOffset, 4)

        return (
            ((this[byteOffset] << 24) |
                (this[byteOffset + 1] << 16) |
                (this[byteOffset + 2] << 8) |
                this[byteOffset + 3]) >>>
            0
        )
    }

    /**
     * **[LITTLE ENDIAN]** Reads a single 32-bit word from the cache.
     *
     * **Should be aligned to 4 bytes.**
     * @param byteOffset The byte offset to read from (optional, defaults to 0).
     * @param endianness Whether to read the value in Little Endian (optional, defaults to false).
     */
    readUint32 = (byteOffset = 0, endianness = this.platformEndianness): number => {
        if (this.normalizeEndianness(endianness) === "LE") return this.readUint32LE(byteOffset)
        return this.readUint32BE(byteOffset)
    }

    /**
     * **[LITTLE ENDIAN]** Reads a certain amount of bytes from the cache and converts it into a big integer.
     *
     * **No alignment is required, the length is automatically calculated.**
     * @param offset The offset to start reading from (optional, defaults to 0).
     * @param length The length to read (optional, defaults to the cache length - offset).
     * @returns The big integer.
     */
    readBigIntLE = (offset = 0, length = this.length - offset): bigint => {
        this.check(offset, length)
        return BigInt(`0x${Buffer.from(this.buffer, offset, length).toString("hex")}`)
    }

    /**
     * **[BIG ENDIAN]** Reads a certain amount of bytes from the cache and converts it into a big integer.
     *
     * **No alignment is required, the length is automatically calculated.**
     * @param offset The offset to start reading from (optional, defaults to 0).
     * @param length The length to read (optional, defaults to the cache length - offset).
     * @returns The big integer.
     */
    readBigIntBE = (offset = 0, length = this.length - offset): bigint => {
        this.check(offset, length)
        return BigInt(`0x${Buffer.from(this.buffer, offset, length).reverse().toString("hex")}`)
    }

    /**
     * Reads a certain amount of bytes from the cache and converts it into a big integer.
     *
     * **No alignment is required, the length is automatically calculated.**
     * @param offset The offset to start reading from (optional, defaults to 0).
     * @param length The length to read (optional, defaults to the cache length - offset).
     * @param endianness Whether to read the value in Little Endian (optional, defaults to false).
     * @returns The big integer.
     */
    readBigInt = (offset = 0, length = this.length - offset, endianness = this.platformEndianness): bigint => {
        if (this.normalizeEndianness(endianness) === "LE") return this.readBigIntLE(offset, length)
        return this.readBigIntBE(offset, length)
    }

    /**
     * ====================
     *  CONVERSION METHODS
     * ====================
     */

    /**
     * Converts the cache into an hexadecimal string.
     *
     * **Note:** Always uppercase.
     * @param prefix Whether to prefix the hexadecimal string with `0x` (optional, defaults to false).
     * @param littleEndian Whether to read the value in Little Endian (optional, defaults to false).
     * @returns The hexadecimal string.
     */
    toHexString = (prefix = false): string => {
        const hexString = Buffer.from(this.buffer).toString("hex").toUpperCase()
        if (prefix) return `0x${hexString}`
        return hexString
    }

    /**
     * Converts the cache into an UTF-8 string.
     * @returns The UTF-8 string.
     */
    toUtf8String = (): string => Buffer.from(this.buffer).toString("utf8")

    /**
     * Converts the cache into a string representation.
     *
     * **Note:** Hex values are always uppercase.
     * @param encoding The encoding to use (optional, defaults to "hex").
     * @param hexPrefix Whether to prefix the hexadecimal string with `0x` (optional, defaults to false).
     * @returns The string representation of the cache.
     */
    toString = (encoding: "utf8" | "hex" = "hex", hexPrefix = false): string => {
        if (encoding === "utf8") return this.toUtf8String()
        return this.toHexString(hexPrefix)
    }

    /**
     * Converts the cache into a bit array.
     *
     * **Warning:** This method is not efficient for large caches, use the `toUint8Array` method instead.
     * @param msbFirst Whether to read the bits from the most significant bit (optional, defaults to true).
     * @returns The bit array.
     */
    toBits = (msbFirst = true): Bit[] => {
        const bits: Bit[] = new Array(this.length * 8)
        for (let i = 0; i < this.length * 8; i++) bits[i] = this.readBit(i, msbFirst)
        return bits
    }

    /**
     * Converts the cache into a Uint8Array.
     * @returns The Uint8Array.
     */
    toUint8Array = (): Uint8Array => new Uint8Array(this.buffer, this.offset, this.length)

    /**
     * Converts the cache into a Uint16Array.
     * @returns The Uint16Array.
     */
    toUint16Array = (): Uint16Array => new Uint16Array(this.buffer, this.offset, this.length / 2)

    /**
     * Converts the cache into a Uint32Array.
     * @returns The Uint32Array.
     */
    toUint32Array = (): Uint32Array => new Uint32Array(this.buffer, this.offset, this.length / 4)

    /**
     * ===============
     *  CHECK METHODS
     * ===============
     */

    /**
     * Checks if the current cache is equal to the specified cache.
     */
    equals = (cache: Cache): boolean => {
        if (this.length !== cache.length) {
            return false
        }

        // TODO: Naive approach, improve this
        for (let i = 0; i < this.length; i++) {
            if (this[i] !== cache[i]) {
                return false
            }
        }

        return true
    }

    /**
     * Check if the cache is empty.
     * @returns Whether the cache is empty.
     */
    isEmpty = (): boolean => {
        for (let i = 0; i < this.length; i++) {
            if (this[i] !== 0) return false
        }

        return true
    }

    /**
     * ====================
     *  RANDOMNESS METHODS
     * ====================
     */

    /**
     * Randomly fills the cache with bytes.
     *
     * **WARNING:** This method is not safe for cryptographic contexts, use the `safeRandomFill` method
     * when security is a concern.
     * @param offset The offset to start filling at (optional, defaults to 0).
     * @param length The length to fill (optional, defaults to the cache length - offset).
     */
    randomFill = (offset = 0, length = this.length - offset) => {
        this.check(offset, length)

        for (let i = 0; i < length; i += 8) {
            const randomValue = Math.random() * 0x100000000
            const offsetIndex = i + offset

            this[offsetIndex] = randomValue & 0xff
            this[offsetIndex + 1] = (randomValue >> 8) & 0xff
            this[offsetIndex + 2] = (randomValue >> 16) & 0xff
            this[offsetIndex + 3] = (randomValue >> 24) & 0xff
            this[offsetIndex + 4] = (randomValue >> 32) & 0xff
            this[offsetIndex + 5] = (randomValue >> 40) & 0xff
            this[offsetIndex + 6] = (randomValue >> 48) & 0xff
            this[offsetIndex + 7] = (randomValue >> 56) & 0xff
        }
    }

    /**
     * Randomly fills the cache with bytes.
     *
     * **WARNING:** This method is safe for cryptographic contexts, but is far slower than the `randomFill` method,
     * use this method when security is a concern. Uses the Node.js `crypto.randomFillSync` method.
     * @param offset The offset to start filling at (optional, defaults to 0).
     * @param length The length to fill (optional, defaults to the cache length - offset).
     */
    safeRandomFill = (offset = 0, length = this.length) => randomFillSync(this, offset, length)

    /**
     * =================
     *  UTILITY METHODS
     * =================
     */

    /**
     * Copies the cache into a new cache.
     * @param offset The offset to start copying at (optional, defaults to 0).
     * @param length The length to copy (optional, defaults to the cache length).
     * @returns The copied cache.
     */
    copy = (offset = 0, length = this.length): Cache => {
        this.check(offset, length)
        const cache = new Cache(length)
        for (let i = 0; i < length; i++) cache[i] = this[i + offset]
        return cache
    }

    /**
     * Returns a new cache that references the same memory as the original cache,
     * A lot more efficient than copying it (~ 4 times faster than the `copy` method).
     * @param offset The start offset (optional, defaults to 0).
     * @param end The end offset (optional, defaults to the cache length).
     * @returns The subarray.
     */
    subarray = (offset = 0, length = this.length): Cache =>
        new Cache(length, {
            buffer: this.buffer,
            offset: offset,
            length: length,
        })

    /**
     * Swaps the order of the cache.
     * @param offset The offset to start swapping at (optional, defaults to 0).
     * @param length The length to swap (optional, defaults to the cache length).
     * @param wordLength The length per word (optional, defaults to 4).
     */
    swap = (offset = 0, length = this.length, wordLength = 4): this => {
        this.check(offset, length)
        if (wordLength < 2) throw new RangeError(`[Cache - swap] Invalid word length: '${wordLength}'.`)
        if (wordLength % 2 !== 0) throw new RangeError(`[Cache - swap] Invalid word length alignment: '${wordLength}'.`)

        const calculatedLength = offset + length
        for (let i = 0; i < calculatedLength; i += wordLength) {
            const offsetIndex = i + offset

            for (let j = 0; j < wordLength / 2; j++) {
                const temp = this[offsetIndex + j]
                this[offsetIndex + j] = this[offsetIndex + wordLength - j - 1]
                this[offsetIndex + wordLength - j - 1] = temp
            }
        }

        return this
    }

    /**
     * Reverses a part of the cache.
     * @param offset The offset to start reversing at (optional, defaults to 0).
     * @param length The length to reverse (optional, defaults to the cache length).
     * @returns The cache.
     */
    partialReverse = (offset = 0, length = this.length): this => {
        this.check(offset, length)

        const calculatedLength = offset + length
        for (let i = 0; i < length / 2; i++) {
            const offsetIndex = i + offset
            const endOffsetIndex = calculatedLength - i - 1
            const temp = this[offsetIndex]
            this[offsetIndex] = this[endOffsetIndex]
            this[endOffsetIndex] = temp
        }

        return this
    }

    /**
     * Reverses the entire cache.
     * @returns The cache.
     */
    reverse = (): this => {
        super.reverse()
        return this
    }

    /**
     * Rotates the cache to the left.
     */
    rotateLeft = (): this => {
        // TODO: Naive approach, improve this
        const first = this[0]
        for (let i = 0; i < this.length - 1; i++) this[i] = this[i + 1]
        this[this.length - 1] = first
        return this
    }

    /**
     * Rotates the cache to the right.
     * @returns The cache.
     */
    rotateRight = (): this => {
        // TODO: Naive approach, improve this
        const last = this[this.length - 1]
        for (let i = this.length - 1; i > 0; i--) this[i] = this[i - 1]
        this[0] = last
        return this
    }

    /**
     * Shifts the cache to the left, filling the empty space with zeros.
     * @param offset The offset to start shifting at (optional, defaults to 0).
     * @param length The length to shift (optional, defaults to the cache length).
     * @param shift The number of bytes to shift (optional, defaults to 1).
     * @returns The cache.
     */
    shiftLeft = (offset = 0, length = this.length, shift = 1): this => {
        this.check(offset, length)

        // TODO: Naive approach, improve this
        for (let i = 0; i < this.length - 1; i++) this[i] = this[i + shift]
        for (let i = 0; i < shift; i++) this[this.length - i - 1] = 0

        return this
    }

    /**
     * Shifts the cache to the right, filling the empty spaces with zeros.
     * @param offset The offset to start shifting at (optional, defaults to 0).
     * @param length The length to shift (optional, defaults to the cache length).
     * @param shift The number of bytes to shift (optional, defaults to 1).
     * @returns The cache.
     */
    shiftRight = (offset = 0, length = this.length, shift = 1): this => {
        this.check(offset, length)

        // TODO: Naive approach, improve this
        for (let i = this.length - 1; i > 0; i--) this[i] = this[i - shift]
        for (let i = 0; i < shift; i++) this[i] = 0

        return this
    }

    /**
     * Fills the cache with a specified value.
     * @param value The value to fill the cache with.
     * @param offset The offset to start filling at (optional, defaults to 0).
     * @param length The length to fill (optional, defaults to the cache length).
     * @returns The cache.
     */
    fill = (value: number, offset = 0, length = this.length): this => {
        if (value < 0 || value > 0xff) throw new RangeError(`[Cache - fill] Invalid value: '${value}'.`)
        this.check(offset, length)
        super.fill(value, offset, offset + length)
        return this
    }

    /**
     * Clears the cache by filling it with zeros.
     * @param offset The offset to start clearing at (optional, defaults to 0).
     * @param length The length to clear (optional, defaults to the cache length).
     * @returns The cache.
     */
    clear = (offset = 0, length = this.length): this => {
        super.fill(0, offset, length)
        return this
    }
}
