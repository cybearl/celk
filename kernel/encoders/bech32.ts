import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"
import errorCodes, { formatError } from "#lib/constants/errors"

/**
 * The Bech32 encoder class is used to encode Bech32 strings
 * from their binary representation stored in a `Cache` instance.
 *
 * It also provides methods to decode Bech32 strings back to
 * their binary representation.
 *
 * More info about Bech32 encoding can be found at:
 * - [BIP-0173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki).
 * - [Reference implementation](https://github.com/sipa/bech32/tree/master/ref/javascript).
 */
export default class Bech32Encoder {
    private charset = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
    private generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

    /**
     * Stores the current encoding constant (either for Bech32 or Bech32m).
     * - In the case of Bech32, the constant is set to 1.
     * - In the case of Bech32m, the constant is set to 0x2bc830a3.
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
    get encoding(): "bech32" | "bech32m" {
        return this.bech32m === 1 ? "bech32" : "bech32m"
    }

    /**
     * Computes the Bech32 checksum for the data stored
     * at the `MemorySlot` inside of a `Cache` instance.
     * @param cache The `Cache` instance to read from.
     * @param slot The position in the `Cache` to read from.
     * @returns The computed checksum.
     */
    private polymod(cache: Cache, slot: MemorySlot): number {
        let checksum = 1

        for (let i = slot.start; i < slot.end; i++) {
            const highNibble = checksum >> 25
            checksum = ((checksum & 0x1ffffff) << 5) ^ cache[i]

            for (let j = 0; j < 5; j++) {
                if ((highNibble >> j) & 1) checksum ^= this.generator[j]
            }
        }

        return checksum
    }

    /**
     * Expands the HRP (Human Readable Part) into its binary representation.
     * @param cache The `Cache` instance to write to.
     * @param slot The position in the `Cache` to write to.
     * @param hrp The HRP to expand.
     * @returns The expanded HRP as a `Cache` instance.
     */
    private expandHrp(cache: Cache, slot: MemorySlot, hrp: string): Cache {
        const expandedHrpLength = hrp.length * 2 + 1

        if (slot.length < expandedHrpLength || slot.end - slot.start < expandedHrpLength) {
            throw new Error(formatError(errorCodes.BECH32_INVALID_HRP_SLOT_SIZE, undefined, { slot, hrp }))
        }

        for (let i = 0; i < hrp.length; i++) {
            cache[slot.start + i] = hrp.charCodeAt(i) >> 5
            cache[slot.start + i + hrp.length + 1] = hrp.charCodeAt(i) & 31
        }

        cache[slot.start + hrp.length] = 0

        return cache
    }

    /**
     * Creates a Bech32 checksum from the HRP and data based on the current encoding.
     * @param cache The `Cache` instance to write to.
     * @param slot The position in the `Cache` to write to.
     * @param hrp The HRP to use.
     * @param data The data to use.
     */
    private createChecksum(cache: Cache, slot: MemorySlot, hrp: string, data: Uint8Array) {
        const expandedHrpLength = hrp.length * 2 + 1
        const checksumLength = expandedHrpLength + data.length + 6

        if (slot.length < checksumLength || slot.end - slot.start < checksumLength) {
            throw new Error(formatError(errorCodes.BECH32_INVALID_CHECKSUM_SLOT_SIZE, undefined, { slot, hrp, data }))
        }

        // Write the expanded HRP to the cache
        this.expandHrp(cache, slot, hrp)

        // Write the data to the cache
        for (const [i, datum] of data.entries()) {
            cache[slot.start + expandedHrpLength + i] = datum
        }

        // Compute the checksum
        const polymod =
            this.polymod(cache, {
                start: slot.start,
                length: checksumLength,
                end: slot.start + checksumLength,
            }) ^ this.bech32m
    }
}
