import secp256k1 from "secp256k1";

import type { MemorySlot } from "lib/constants/memory";
import type Cache from "lib/kernel/cache";
import { CURVE, Point } from "lib/kernel/ecdsa";


/**
 * Bitcoin public key generation mode.
 */
export type PublicKeyGenMode = "UNCOMPRESSED" | "COMPRESSED";

/**
 * A wrapper around the "secp256k1" library.
 *
 * Accessible at:
 *  - https://www.npmjs.com/package/secp256k1
 *  - https://github.com/cryptocoinjs/secp256k1-node
 */
export class Secp256k1Algorithm_v1 {
    // Endpoint to generate the public key based on the current public key generation mode
    private executeEndpoint: (cache: Cache, slot: MemorySlot) => void;

    /**
     * Construct a new SECP256K1 algorithm.
     * @param publicKeyGenMode The public key generation mode (compressed or uncompressed).
     */
    constructor(publicKeyGenMode: PublicKeyGenMode) {
        switch (publicKeyGenMode) {
            case "UNCOMPRESSED":
                this.executeEndpoint = this.executeUncompressed;
                break;
            case "COMPRESSED":
                this.executeEndpoint = this.executeCompressed;
                break;
            default:
                throw new Error(`[Secp256k1Algorithm_v1] Invalid public key generation mode: '${publicKeyGenMode}'.`);
        }
    }

    /**
     * Execute the SECP256K1 algorithm (uncompressed key - 65 bytes).
     * @param cache The cache to use (input & output).
     * @param slot The memory slot to write to.
     */
    private executeUncompressed = (cache: Cache, slot: MemorySlot): void => {
        // eslint-disable-next-line import/no-named-as-default-member
        const publicKey = secp256k1.publicKeyCreate(cache.subarray(slot.readFrom.offset, slot.readFrom.end), false);

        // Write to the cache
        cache.write(publicKey, slot.writeTo.offset, slot.writeTo.bytes);
    };

    /**
     * Execute the SECP256K1 algorithm (compressed key - 33 bytes).
     * @param cache The cache to use (input & output).
     * @param slot The memory slot to write to.
     */
    private executeCompressed = (cache: Cache, slot: MemorySlot): void => {
        // eslint-disable-next-line import/no-named-as-default-member
        const publicKey = secp256k1.publicKeyCreate(cache.subarray(slot.readFrom.offset, slot.readFrom.end), true);

        // Write to the cache
        cache.write(publicKey, slot.writeTo.offset, slot.writeTo.bytes);
    };

    /**
     * Change the public key generation mode.
     * @param publicKeyGenMode The new public key generation mode (compressed or uncompressed).
     */
    setPublicKeyGenMode = (publicKeyGenMode: PublicKeyGenMode): void => {
        switch (publicKeyGenMode) {
            case "UNCOMPRESSED":
                this.executeEndpoint = this.executeUncompressed;
                break;
            case "COMPRESSED":
                this.executeEndpoint = this.executeCompressed;
                break;
            default:
                throw new Error(`[Secp256k1Algorithm_v1] Invalid SECP256K1 generation mode: '${publicKeyGenMode}'.`);
        }
    };

    /**
     * Main endpoint to execute the SECP256K1 algorithm (defined in the constructor).
     * @param cache The cache to use (input & output).
     * @param slot The memory slot to write to.
     */
    execute = (cache: Cache, slot: MemorySlot): void => this.executeEndpoint(cache, slot);
}

/**
 * A TypeScript implementation of the Elliptic Curve, SECP256K1, as defined in SEC 2.
 *
 * Based on the "Learning fast elliptic-curve cryptography" explanation by Paul Miller:
 *   - https://paulmillr.com/posts/noble-secp256k1-fast-ecc/
 *   - https://github.com/paulmillr/noble-secp256k1/blob/main/index.ts
 *
 * And the TS implementation by Hanabi1224:
 *   - https://github.com/hanabi1224/Programming-Language-Benchmarks/blob/main/bench/algorithm/secp256k1/1.ts
 */
export class Secp256k1Algorithm_v2 {
    private readonly G = new Point(CURVE.Gx, CURVE.Gy);

    // Endpoint to generate the public key based on the current public key generation mode
    private executeEndpoint: (cache: Cache, slot: MemorySlot) => void;

    /**
     * Construct a new SECP256K1 algorithm.
     * @param publicKeyGenMode The public key generation mode (compressed or uncompressed).
     */
    constructor(publicKeyGenMode: PublicKeyGenMode) {
        switch (publicKeyGenMode) {
            case "UNCOMPRESSED":
                this.executeEndpoint = this.executeUncompressed;
                break;
            case "COMPRESSED":
                this.executeEndpoint = this.executeCompressed;
                break;
            default:
                throw new Error(`[Secp256k1Algorithm_v1] Invalid public key generation mode: '${publicKeyGenMode}'.`);
        }
    }

    /**
     * Execute the SECP256K1 algorithm (uncompressed key - 65 bytes).
     * @param cache The buffer cache to use (input & output).
     * @param privateKey The private key.
     * @param privateKey The private key as a buffer.
     */
    private executeUncompressed = (cache: Cache, slot: MemorySlot): void => {
        const privateKey = cache.subarray(slot.readFrom.offset, slot.readFrom.end).readBigIntBE();
        const point = this.G.multiply(privateKey);

        // X coordinate of the public key (base 16)
        let x = point.x.toString(16);

        // Y coordinate of the public key (base 16)
        let y = point.y.toString(16);

        // Fill up the missing zeros
        while (x.length < 64) x = `0${x}`;
        while (y.length < 64) y = `0${y}`;

        // Write the public key to the cache
        cache.writeHexString(`04${x}${y}`, slot.writeTo.offset, slot.writeTo.bytes);
    };

    /**
     * Execute the SECP256K1 algorithm (compressed key - 33 bytes).
     * @param cache The buffer cache to use (input & output).
     * @param privateKey The private key as a buffer.
     */
    private executeCompressed = (cache: Cache, slot: MemorySlot): void => {
        const privateKey = cache.subarray(slot.readFrom.offset, slot.readFrom.end).readBigIntBE();
        const point = this.G.multiply(privateKey);

        // X coordinate of the public key (base 16)
        let x = point.x.toString(16);

        // Fill up the missing zeros
        while (x.length < 64) x = `0${x}`;

        // Write the public key to the cache
        cache.writeHexString(`${point.y % 2n === 0n ? "02" : "03"}${x}`, slot.writeTo.offset, slot.writeTo.bytes);
    };

    /**
     * Change the public key generation mode.
     * @param publicKeyGenMode The new public key generation mode (compressed or uncompressed).
     */
    setPublicKeyGenMode = (publicKeyGenMode: PublicKeyGenMode): void => {
        switch (publicKeyGenMode) {
            case "UNCOMPRESSED":
                this.executeEndpoint = this.executeUncompressed;
                break;
            case "COMPRESSED":
                this.executeEndpoint = this.executeCompressed;
                break;
            default:
                throw new Error(`[Secp256k1Algorithm_v1] setPublicKeyGenMode: Invalid SECP256K1 generation mode: '${publicKeyGenMode}'.`);
        }
    };

    /**
     * Main endpoint to execute the SECP256K1 algorithm (defined in the constructor).
     * @param cache The cache to use (input & output).
     * @param slot The memory slot to write to.
     */
    execute = (cache: Cache, slot: MemorySlot): void => this.executeEndpoint(cache, slot);
}