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
    private modifier: number

    /**
     * Creates a new Bech32 encoder instance.
     * @param encoding The encoding to use (optional, defaults to "bech32").
     */
    constructor(encoding: Bech32Encoding = "bech32") {
        this.modifier = encoding === "bech32m" ? 0x2bc830a3 : 1
    }

    /**
     * Get the current encoding as a string.
     * @returns The current encoding as a string.
     */
    get encoding(): Bech32Encoding {
        return this.modifier === 1 ? "bech32" : "bech32m"
    }

    /**
     * Set the encoding to either Bech32 or Bech32m.
     * @param encoding The encoding to set.
     */
    set encoding(encoding: Bech32Encoding) {
        this.modifier = encoding === "bech32m" ? 0x2bc830a3 : 1
    }

    /**
     * Converts data stored in a `Cache` instance to a Base32 number array.
     * @param cache The `Cache` instance to read the data from.
     * @param slot The position of the data in the cache (optional, defaults to 0 => length).
     * @returns The converted data as a Base32 number array.
     */
    private _convertTo5BitArray(cache: Cache, slot?: MemorySlot): number[] {
        const data = cache.subarray(slot?.start, slot?.length)
        const convertedData = new Array(data.length * 8)

        for (const [i, datum] of data.entries()) {
            for (let j = 0; j < 8; j++) {
                convertedData[i * 8 + j] = (datum >> (7 - j)) & 1
            }
        }

        const dataLength5Bit = Math.ceil((data.length * 8) / 5)

        const result = new Array(dataLength5Bit)

        for (let i = 0; i < dataLength5Bit; i++) {
            let value = 0

            for (let j = 0; j < 5; j++) {
                const index = i * 5 + j
                value = value * 2 + (convertedData[index] || 0)
            }

            result[i] = value
        }

        return result
    }

    /**
     * Computes the Bech32 checksum for the data stored inside an a 5-bit regular number array.
     * @param data The data to compute the checksum for.
     * @returns The computed checksum.
     */
    private _polymod(data: number[]): number {
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
     * Expands the HRP (Human Readable Part) into its bytecode (5-bit regular number array).
     * @param hrp The HRP to expand (Human Readable Part).
     * @returns The expanded HRP as a 5-bit regular number array.
     */
    private _expandHrp(hrp: string): number[] {
        const expandedHrp = new Array(hrp.length * 2 + 1)

        for (const [i, char] of hrp.split("").entries()) {
            expandedHrp[i] = char.charCodeAt(0) >> 5
            expandedHrp[i + hrp.length + 1] = char.charCodeAt(0) & 31
        }

        expandedHrp[hrp.length] = 0

        return expandedHrp
    }

    /**
     * Creates a Bech32 checksum from the HRP (Human Readable Part). and data based on the current encoding.
     * @param hrp The HRP to use (Human Readable Part).
     * @param data The data to use, as a 5-bit regular number array.
     * @returns The computed checksum.
     */
    private _createChecksum(hrp: string, data: number[]): number[] {
        const expandedHrp = this._expandHrp(hrp)
        const checksumData: number[] = new Array(expandedHrp.length + data.length + 6)

        // Write the HRP (Human Readable Part) to the checksum array
        checksumData.concat(expandedHrp)

        // Write the data to the checksum cache
        checksumData.concat(data)

        // Compute the checksum (polymod)
        const polymod = this._polymod(checksumData.concat([0, 0, 0, 0, 0, 0])) ^ this.modifier

        const checksum = new Array(6)
        for (let i = 0; i < 6; i++) {
            checksum[i] = (polymod >> (5 * (5 - i))) & 31
        }

        return checksum
    }

    /**
     * Verifies the checksum of a Bech32 bytecode.
     * @param hrp The HRP to use (Human Readable Part).
     * @param data The data to use, as a 5-bit regular number array.
     */
    private _verifyChecksum(hrp: string, data: number[]): boolean {
        const expandedHrp = this._expandHrp(hrp)
        const checksumData: number[] = new Array(expandedHrp.length + data.length)

        // Write the HRP (Human Readable Part) to the checksum array
        checksumData.concat(expandedHrp)

        // Write the data to the checksum cache
        checksumData.concat(data)

        // Compute the checksum (polymod)
        const polymod = this._polymod(checksumData.concat([0, 0, 0, 0, 0, 0])) ^ this.modifier

        return polymod === 1
    }

    /**
     * Encodes a Bech32 string from the bytecode stored in a `Cache` instance.
     * @param hrp The HRP to use (Human Readable Part).
     * @param cache The `Cache` instance to read the data from.
     * @param slot The position of the data in the cache (optional, defaults to 0 => length).
     */
    encode(hrp: string, cache: Cache, slot?: MemorySlot): string {
        const data = this._convertTo5BitArray(cache, slot)

        // Compute the checksum
        const checksum = this._createChecksum(hrp, data)

        // Add the checksum to the data
        const bech32Data = data.concat(checksum)

        let bech32String = `${hrp}1`
        for (const datum of bech32Data) bech32String += this._CHARSET[datum] || ""

        return bech32String
    }

    /**
     * Decodes a Bech32 string back to its bytecode and writes it in a `Cache` instance.
     * @param bech32String The Bech32 string to decode.
     * @param cache The `Cache` instance to write the data to.
     * @param slot The position of the data in the cache (optional, defaults to 0 => length).
     * @throws An error if the Bech32 string is invalid.
     */
    // decode(bech32String: string, cache: Cache, slot?: MemorySlot): void {
    //     if (bech32String.length < 8) {
    //         throw new Error(
    //             fe(KernelErrors.INVALID_BECH32_LENGTH, "The Bech32 string is too short (less than 8 characters).")
    //         )
    //     }

    //     if (bech32String.length > 90) {
    //         throw new Error(
    //             fe(KernelErrors.INVALID_BECH32_LENGTH, "The Bech32 string is too long (more than 90 characters).")
    //         )
    //     }

    //     let hasLowercase = false
    //     let hasUppercase = false

    //     for (const char of bech32String) {
    //         if (char.charCodeAt(0) < 33 || char.charCodeAt(0) > 126) {
    //             throw new Error(fe(KernelErrors.INVALID_BECH32_CHARACTER))
    //         }

    //         if (char >= "a" && char <= "z") hasLowercase = true
    //         if (char >= "A" && char <= "Z") hasUppercase = true
    //     }

    //     if (hasLowercase && hasUppercase) {
    //         throw new Error(fe(KernelErrors.INVALID_BECH32_CASE))
    //     }

    //     const bech32DataString = bech32String.toLowerCase()
    //     const separatorPosition = bech32DataString.lastIndexOf("1")
    //     const dataLength = bech32DataString.length - separatorPosition - 1

    //     if (separatorPosition === -1) {
    //         throw new Error(fe(KernelErrors.BECH32_SEPARATOR_NOT_FOUND))
    //     }

    //     if (separatorPosition === 0) {
    //         throw new Error(fe(KernelErrors.INVALID_BECH32_HRP))
    //     }

    //     if (slot && (slot.length < dataLength || slot.end < dataLength)) {
    //         throw new Error(
    //             fe(KernelErrors.INVALID_BECH32_LENGTH, "The Bech32 string data is too long for the given slot.")
    //         )
    //     }

    //     const hrp = bech32DataString.slice(0, separatorPosition)
    //     const data = new Uint8Array(dataLength)

    //     for (let i = 0; i < dataLength; i++) {
    //         const char = bech32DataString[separatorPosition + 1 + i]
    //         const index = this._CHARSET.indexOf(char)

    //         if (index === -1) throw new Error(fe(KernelErrors.INVALID_BECH32_CHARACTER))

    //         data[i] = index
    //     }

    //     if (!this.verifyChecksum(hrp, data)) {
    //         throw new Error(fe(KernelErrors.INVALID_BECH32_CHECKSUM))
    //     }

    //     const payload = data.slice(0, data.length - 6)
    //     for (const [i, datum] of payload.entries()) cache.writeUint8((slot?.start || 0) + i, datum)
    // }
}
