import config from "configs/main.config";
import type { MemorySlot } from "lib/constants/memory";
import type Cache from "lib/kernel/cache";
import logger from "lib/utils/logger";
import { bigIntByteLength } from "lib/utils/maths";


/**
 * Bitcoin private key generation mode.
 */
export type PrivateKeyGenMode = "RANDOM" | "ASCENDING" | "DESCENDING";

/**
 * Used to generate a private key between a given range.
 */
export default class PrivateKeyGenerator {
    // Ranges
    private low: bigint | undefined;
    private high: bigint | undefined;

    // Mask, used to generate random private keys within a range
    private mask: number | undefined;

    // Endpoint to generate the private key based on the current private key generation mode
    private executeEndpoint: ((cache: Cache, slot: MemorySlot) => void) | undefined;

    /**
     * Construct a new Private Key Generator.
     * @param privateKeyGenMode The private key generation mode.
     * @param privateLengthInBytes The length of the private key in bytes.
     * @param low The low range to generate the private key from.
     * @param high The high range to generate the private key from.
     */
    constructor(
        privateKeyGenMode: PrivateKeyGenMode,
        privateLengthInBytes: number,
        low: bigint,
        high: bigint
    ) {
        this.setPrivateKeyGenMode(privateKeyGenMode);
        this.setRange(low, high);
    }

    /**
     * Change the private key generation mode.
     * @param privateKeyGenMode The new private key generation mode.
     */
    setPrivateKeyGenMode = (privateKeyGenMode: PrivateKeyGenMode): void => {
        switch (privateKeyGenMode) {
            case "RANDOM":
                this.executeEndpoint = this.executeRandom;
                break;
            case "ASCENDING":
                this.executeEndpoint = this.executeAscending;
                break;
            case "DESCENDING":
                this.executeEndpoint = this.executeDescending;
                break;
            default:
                throw new Error(`[PrivateKeyGenerator] Invalid private key generation mode: '${privateKeyGenMode}'.`);
        }
    };

    /**
     * Change the range to generate the private key from.
     * @param low The new low range.
     * @param high The new high range.
     */
    setRange = (low: bigint, high: bigint): void => {
        this.low = low;
        this.high = high;
        this.mask = bigIntByteLength(high);
    };

    /**
     * **[RANDOM]** Generate a private key between a given range (defined in the constructor).
     * @param cache The cache to write the private key to.
     * @param slot The memory slot to write to.
     * @returns The private key as a bigint.
     */
    private executeRandom = (cache: Cache, slot: MemorySlot): void => {

    };

    /**
     * **[ASCENDING]** Generate a private key between a given range (defined in the constructor).
     * @param cache The cache to write the private key to.
     * @param slot The memory slot to write to.
     */
    private executeAscending = (cache: Cache, slot: MemorySlot): void => {

    };

    /**
     * **[DESCENDING]** Generate a private key between a given range (defined in the constructor).
     * @param cache The cache to write the private key to.
     * @param slot The memory slot to write to.
     */
    private executeDescending = (cache: Cache, slot: MemorySlot): void => {

    };

    /**
     * Main endpoint to generate a private key between a given range (defined in the constructor).
     * @param cache The cache to write the private key to.
     * @param slot The memory slot to write to.
     */
    execute = (cache: Cache, slot: MemorySlot): void => this.executeEndpoint?.(cache, slot);
}