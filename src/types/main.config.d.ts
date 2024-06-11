import type { PrivateKeyGenMode } from "lib/kernel/crypto/generators/privateKeyGenerator";


/**
 * The main configuration object, shared across the entire system.
 */
export type Config = {
    /**
     * The environment of the configuration, either `production` or `development`.
     */
    environment: "production" | "development";

    /**
     * The address to find, if any.
     *
     * **Note:** There's no need to add the `0x` prefix to the address (for Ethereum).
     * Also, the type of address is automatically detected.
     *
     * **Bitcoin:** Internally reverted back to its `RIPEMD-160` hash:
     * - No need to compute 2 `SHA-256` hashes for the checksum.
     * - No need to compute the `Base58` encoding for the final address.
     *
     * **Ethereum:** Internally reverted back to its `KECCAK-256` hash:
     * - Only a single hash is needed for the address.
     *
     * **Note:** While checksums are important for the final address,
     * the benefits versus the costs of computing them are not worth it.
     */
    addressToFind: string | null;

    /**
     * The public key to find, if any.
     *
     * If this is set, the generator generation mode is automatically set to `PUBLIC_KEY`,
     * and the only thing that it will produce is a pair of private and public keys.
     *
     * **Note:** There's no need to add the `0x` prefix to the public key,
     * either with Bitcoin or Ethereum.
     *
     * **Bitcoin:** Supports both compressed and uncompressed public keys with their prefixes.
     * - Compressed public keys start with `0x02` or `0x03`.
     * - Uncompressed public keys start with `0x04`.
     *
     * **Ethereum:** Supports only compressed public keys with its standard format.
     * - 32 bytes for the `X` coordinate.
     * - 32 bytes for the `Y` coordinate.
     */
    publicKeyToFind: string | null;

    /**
     * This option is used to reverse the address into a public key
     * instead of trying to find the address directly from the private key.
     */
    reverseAddressIntoPublicKey: boolean;

    /**
     * If the public key is compressed or not.
     *
     * A private key can generate both compressed and uncompressed public keys,
     * giving two different addresses for the same private key.
     */
    isPublicKeyCompressed: boolean;

    /**
     * The generation mode of the private key, either `RANDOM`, `ASCENDING` or `DESCENDING`.
     * - `RANDOM` for a fully random private key in the given range.
     * - `ASCENDING` for an ascending private key in the given range.
     * - `DESCENDING` for a descending private key in the given range.
     */
    privateKeyGenMode: PrivateKeyGenMode;

    /**
     * The low range of the private key.
     *
     * When not defined, it defaults to the lowest value of the SECP256K1 finite space
     * which is `0x1`.
     *
     * More info about it on the [Wikipedia article](https://en.bitcoin.it/wiki/Secp256k1).
     */
    privateKeyLowRange: bigint;

    /**
     * The high range of the private key.
     *
     * When not defined, it defaults to the highest value of the SECP256K1 finite space
     * which is `0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140`.
     *
     * More info about it on the [Wikipedia article](https://en.bitcoin.it/wiki/Secp256k1).
     */
    privateKeyHighRange: bigint;

    /**
     * Corresponds to the duration in milliseconds for a single benchmark measure.
     */
    benchmarkDuration: number;

    /**
     * The size of the input for the crypto benchmarking,
     * allowing for a more precise benchmarking, depending
     * on the platform and the hardware.
     */
    cacheBenchmarkInputSize: number;
};
