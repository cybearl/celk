import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"
import errorCodes, { formatError } from "#lib/constants/errors"

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
    private readonly CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
    private readonly GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

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
     * Computes the Bech32 checksum for the data stored inside an `Uint8Array` instance.
     * @param data The `Uint8Array` instance to compute the checksum from.
     * @returns The computed checksum.
     */
    private polymod(data: Uint8Array): number {
        let checksum = 1

        for (const datum of data) {
            const highNibble = checksum >> 25
            checksum = ((checksum & 0x1ffffff) << 5) ^ datum

            for (let j = 1; j < 5; j++) {
                if ((highNibble >> j) & 1) checksum ^= this.GENERATOR[j]
            }
        }

        return checksum
    }

    /**
     * Expands the HRP (Human Readable Part) into its bytecode.
     * @param hrp The HRP to expand.
     * @returns The expanded HRP as an `Uint8Array` instance.
     */
    private expandHrp(hrp: string): Uint8Array {
        const expandedHrp = new Uint8Array(hrp.length * 2 + 1)

        for (let i = 0; i < hrp.length; i++) {
            expandedHrp[i] = hrp.charCodeAt(i) >> 5
            expandedHrp[i + hrp.length + 1] = hrp.charCodeAt(i) & 31
        }

        expandedHrp[hrp.length] = 0

        return expandedHrp
    }

    /**
     * Creates a Bech32 checksum from the HRP and data based on the current encoding.
     * @param hrp The HRP to use.
     * @param data The data to use, as an `Uint8Array` instance.
     */
    private createChecksum(hrp: string, data: Uint8Array): Uint8Array {
        const checksumLength = hrp.length * 2 + 1 + data.length + 6
        const checksum = new Uint8Array(checksumLength)

        // Write the HRP to the checksum array
        const expandedHrp = this.expandHrp(hrp)
        for (const [i, datum] of expandedHrp.entries()) checksum[i] = datum

        // Write the data to the checksum cache
        for (const [i, datum] of data.entries()) checksum[expandedHrp.length + i] = datum

        // Compute the checksum (polymod)
        const polymod = this.polymod(checksum) ^ this.bech32m

        // Write the checksum into a new Uint8Array instance
        const result = new Uint8Array(6)
        for (let i = 0; i < 6; i++) result[i] = (polymod >> (5 * (5 - i))) & 31

        return result
    }

    /**
     * Verifies the checksum of a Bech32 bytecode.
     * @param hrp The HRP to use.
     * @param data The data to use, as an `Uint8Array` instance.
     */
    private verifyChecksum(hrp: string, data: Uint8Array): boolean {
        const checksumLength = hrp.length * 2 + 1 + data.length
        const checksum = new Uint8Array(checksumLength)

        // Write the HRP to the checksum array
        const expandedHrp = this.expandHrp(hrp)
        for (const [i, datum] of expandedHrp.entries()) checksum[i] = datum

        // Write the data to the checksum cache
        for (const [i, datum] of data.entries()) checksum[expandedHrp.length + i] = datum

        // Compute the checksum (polymod)
        const polymod = this.polymod(checksum)

        // Verify the checksum
        return polymod === this.bech32m
    }

    /**
     * Encodes a Bech32 string from the bytecode stored in a `Cache` instance.
     * @param cache The `Cache` instance to read the data from.
     * @param slot The position of the data in the cache.
     */
    encode()

    /**
     * Decodes a Bech32 string back to its bytecode and writes it in a `Cache` instance.
     */
}
