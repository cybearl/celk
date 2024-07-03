import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"
import { KernelErrors, fe } from "#lib/constants/errors"

/**
 * The Bech32 encoding type.
 */
export type Bech32Encoding = "bech32" | "bech32m"

/**
 * The Bech32 encoder class is used to encode Bech32 strings
 * from their bytecode stored in a `Cache` instance.
 *
 * It also provides methods to decode Bech32 strings back to
 * their bytecode.
 *
 * More info about Bech32 encoding can be found at:
 * - [BIP-0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki).
 * - [Reference implementation](https://github.com/sipa/bech32/tree/master/ref/javascript).
 */
export default class Bech32Encoder {
    private readonly _CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
    private readonly _GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

    /**
     * Stores the current encoding constant (either for Bech32 or Bech32m).
     * - In the case of Bech32, the constant is set to `1`.
     * - In the case of Bech32m, the constant is set to `0x2bc830a3`.
     */
    private bech32m: number

    /**
     * Creates a new Bech32 encoder instance.
     * @param bech32m Whether to use Bech32m encoding.
     */
    constructor(bech32m = false) {
        this.bech32m = bech32m ? 0x2bc830a3 : 1
    }

    /**
     * Get the current encoding as a string.
     * @returns The current encoding as a string.
     */
    get encoding(): Bech32Encoding {
        return this.bech32m === 1 ? "bech32" : "bech32m"
    }

    /**
     * Set the encoding to either Bech32 or Bech32m.
     * @param encoding The encoding to set.
     */
    set encoding(encoding: Bech32Encoding) {
        this.bech32m = encoding === "bech32m" ? 0x2bc830a3 : 1
    }

    /**
     * Computes the Bech32 checksum for the data stored inside an `Uint8Array` instance.
     * @param data The `Uint8Array` instance to compute the checksum from.
     * @returns The computed checksum.
     */
    private _polymod(data: Uint8Array): number {
        let checksum = 1

        for (const datum of data) {
            const highNibble = checksum >> 25
            checksum = ((checksum & 0x1ffffff) << 5) ^ datum

            for (let i = 0; i < 5; i++) {
                if ((highNibble >> i) & 1) checksum ^= this._GENERATOR[i]
            }
        }

        return checksum
    }

    /**
     * Expands the HRP (Human Readable Part) into its bytecode.
     * @param hrp The HRP to expand (Human Readable Part).
     * @returns The expanded HRP as an `Uint8Array` instance.
     */
    private _expandHrp(hrp: string): Uint8Array {
        const expandedHrp = new Uint8Array(hrp.length * 2 + 1)

        for (let i = 0; i < hrp.length; i++) {
            expandedHrp[i] = hrp.charCodeAt(i) >> 5
            expandedHrp[i + hrp.length + 1] = hrp.charCodeAt(i) & 31
        }

        expandedHrp[hrp.length] = 0

        return expandedHrp
    }

    /**
     * Creates a Bech32 checksum from the HRP (Human Readable Part). and data based on the current encoding.
     * @param hrp The HRP to use (Human Readable Part).
     * @param data The data to use, as an `Uint8Array` instance.
     */
    private _createChecksum(hrp: string, data: Uint8Array): Uint8Array {
        const checksumData = new Uint8Array(hrp.length * 2 + 1 + data.length + 6)
        const expandedHrp = this._expandHrp(hrp)

        // Write the HRP (Human Readable Part) to the checksum array
        checksumData.set(expandedHrp, 0)

        // Write the data to the checksum cache
        checksumData.set(data, expandedHrp.length)

        // Compute the checksum (polymod)
        const polymod = this._polymod(checksumData) ^ this.bech32m

        // Write the checksum into a new Uint8Array instance
        const checksum = new Uint8Array(6)
        for (let i = 0; i < 6; i++) checksum[i] = (polymod >> (5 * (5 - i))) & 31

        return checksum
    }

    /**
     * Verifies the checksum of a Bech32 bytecode.
     * @param hrp The HRP to use (Human Readable Part).
     * @param data The data to use, as an `Uint8Array` instance.
     */
    private verifyChecksum(hrp: string, data: Uint8Array): boolean {
        const checksumData = new Uint8Array(hrp.length * 2 + 1 + data.length)
        const expandedHrp = this._expandHrp(hrp)

        // Write the HRP (Human Readable Part) to the checksum array
        checksumData.set(expandedHrp, 0)

        // Write the data to the checksum cache
        checksumData.set(data, expandedHrp.length)

        // Compute the checksum (polymod)
        const polymod = this._polymod(checksumData)

        // Verify the checksum
        return polymod === this.bech32m
    }

    /**
     * Encodes a Bech32 string from the bytecode stored in an `Uint8Array` instance
     * and returns it as a string.
     * @param hrp The HRP to use (Human Readable Part).
     * @param data The data to use, as an `Uint8Array` instance.
     * @returns The encoded Bech32 string as an `Uint8Array` instance.
     */
    private _encode(hrp: string, data: Uint8Array): string {
        const checksum = this._createChecksum(hrp, data)

        let bech32 = `${hrp}1`
        for (const datum of data) bech32 += this._CHARSET[datum]
        for (const datum of checksum) bech32 += this._CHARSET[datum]

        return bech32
    }

    /**
     * Encodes a Bech32 string from the bytecode stored in a `Cache` instance.
     * @param hrp The HRP to use (Human Readable Part).
     * @param cache The `Cache` instance to read the data from.
     * @param slot The position of the data in the cache.
     */
    encode(hrp: string, cache: Cache, slot: MemorySlot): string {
        const data = new Uint8Array(slot.length)
        for (let i = 0; i < slot.length; i++) data[i] = cache.readUint8(slot.start + i)

        return this._encode(hrp, data)
    }

    /**
     * Encodes a Bech32 string from the bytecode stored in an `Uint8Array` instance.
     * @param hrp The HRP to use (Human Readable Part).
     * @param data The data to use, as an `Uint8Array` instance.
     * @returns The encoded Bech32 string as an `Uint8Array` instance.
     */
    encodeFromBytes(hrp: string, data: Uint8Array): string {
        return this._encode(hrp, data)
    }

    /**
     * Decodes a Bech32 string back to its bytecode and writes it in a `Cache` instance or
     * returns a `Uint8Array` instance.
     *
     * **Note:** Both `cache` and `slot` are optional. If they are not provided,
     * the method will return the bytecode as an `Uint8Array` instance.
     * @param bech32String The Bech32 string to decode.
     * @param cache The `Cache` instance to write the data to.
     * @param slot The position of the data in the cache.
     * @throws An error if the Bech32 string is invalid.
     */
    private _decode(bech32String: string, cache?: Cache, slot?: MemorySlot): Uint8Array | void {
        if (bech32String.length < 8) {
            throw new Error(
                fe(KernelErrors.INVALID_BECH32_LENGTH, "The Bech32 string is too short (less than 8 characters).")
            )
        }

        if (bech32String.length > 90) {
            throw new Error(
                fe(KernelErrors.INVALID_BECH32_LENGTH, "The Bech32 string is too long (more than 90 characters).")
            )
        }

        let hasLowercase = false
        let hasUppercase = false

        for (const char of bech32String) {
            if (char.charCodeAt(0) < 33 || char.charCodeAt(0) > 126) {
                throw new Error(fe(KernelErrors.INVALID_BECH32_CHARACTER))
            }

            if (char >= "a" && char <= "z") hasLowercase = true
            if (char >= "A" && char <= "Z") hasUppercase = true
        }

        if (hasLowercase && hasUppercase) {
            throw new Error(fe(KernelErrors.INVALID_BECH32_CASE))
        }

        const bech32 = bech32String.toLowerCase()
        const separatorPosition = bech32.lastIndexOf("1")

        if (separatorPosition === -1) {
            throw new Error(fe(KernelErrors.BECH32_SEPARATOR_NOT_FOUND))
        }

        if (separatorPosition === 0) {
            throw new Error(fe(KernelErrors.INVALID_BECH32_HRP))
        }

        const data = new Uint8Array(bech32.length - separatorPosition - 6)

        for (let i = separatorPosition + 1; i < bech32.length; i++) {
            const index = this._CHARSET.indexOf(bech32[i])

            if (index === -1) {
                throw new Error(fe(KernelErrors.INVALID_BECH32_CHARACTER))
            }

            data[i] = index
        }

        const hrp = bech32.slice(0, separatorPosition)
        if (!this.verifyChecksum(hrp, data)) {
            throw new Error(fe(KernelErrors.INVALID_BECH32_CHECKSUM))
        }

        if (!cache || !slot) return data
        for (const [i, datum] of data.entries()) cache.writeUint8(slot.start + i, datum)
    }

    /**
     * Decodes a Bech32 string back to its bytecode and writes it in a `Cache` instance.
     * @param bech32String The Bech32 string to decode.
     * @param cache The `Cache` instance to write the data to.
     * @param slot The position of the data in the cache.
     * @throws An error if the Bech32 string is invalid.
     */
    decode(bech32String: string, cache: Cache, slot: MemorySlot): void {
        this._decode(bech32String, cache, slot)
    }

    /**
     * Decodes a Bech32 string back to its bytecode and returns it as an `Uint8Array` instance.
     * @param bech32String The Bech32 string to decode.
     * @returns The decoded bytecode as an `Uint8Array` instance.
     * @throws An error if the Bech32 string is invalid.
     */
    decodeToBytes(bech32String: string): Uint8Array {
        return this._decode(bech32String) as Uint8Array
    }
}
