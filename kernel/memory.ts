/**
 * The type definition of a memory slot,
 * identifies the indexes and lengths of the data stored inside the memory table.
 */
export type MemorySlot = {
    start: number
    length: number
    end: number
}

/**
 * The base memory table indexes the data stored in a single Cache instance (= Uint8Array)
 * for the initial private key -> RIPEMD-160 hash transformation.
 *
 * This base table is compatible for both legacy and SegWit addresses.
 *
 * Note that the `end` index is exclusive.
 */
const baseBtcMemoryTable = {
    // The private key is stored at indexes 0-31
    privateKey: { start: 0, length: 32, end: 32 },

    // The public key is stored at indexes 32-96. We still allocate 65 bytes
    // to support both compressed and uncompressed public keys
    publicKey: { start: 32, length: 65, end: 97 },

    // The SHA-256 hash of the public key is stored at indexes 97-127
    sha256: { start: 97, length: 32, end: 129 },

    // Skipping 1 byte for the network byte on legacy addresses
    // The RIPEMD-160 hash of the SHA-256 hash is stored at indexes 130-150
    ripemd160: { start: 130, length: 20, end: 150 },
}

/**
 * The memory table indexes the data stored in a single Cache instance (= Uint8Array)
 * for the legacy address generation (base58 encoding).
 *
 * This table is only compatible with:
 * - Legacy P2PKH addresses (starting with `1`).
 * - Legacy P2SH-P2WPKH addresses (starting with `3`).
 *
 * Note that the `end` index is exclusive.
 *
 * More info [here](https://en.bitcoin.it/w/images/en/9/9b/PubKeyToAddr.png).
 */
export const base58MemoryTable = {
    ...baseBtcMemoryTable,

    // The network byte is stored at index 129
    networkByte: { start: 129, length: 1, end: 130 },

    // The checksum is stored at indexes 150-154
    // It is the first 4 bytes of the double SHA-256 hash
    // And stored just after the RIPEMD-160 hash to be
    // read in a single operation
    checksum: { start: 150, length: 4, end: 154 },

    // Double SHA-256 checksum is stored at indexes 154-186
    // Note that the second SHA-256 hash overwrites the first one
    doubleSha256: { start: 154, length: 32, end: 186 },

    // NOT for writing, only for reading the data that will be
    // converted via Base58 encoding to the final address
    address: { start: 129, length: 25, end: 154 },
}

/**
 * The Bech32 memory table indexes the data stored in a single Cache instance (= Uint8Array)
 * for the SegWit address generation (Bech32 encoding).
 *
 * This table is only compatible with:
 * - Native SegWit P2TR addresses (starting with `bc1p`).
 * - Native SegWit P2WPKH addresses (starting with `bc1q`).
 *
 * Note that the `end` index is exclusive.
 *
 * More info [here](https://en.bitcoin.it/wiki/Bech32).
 */
export const bech32MemoryTable = {
    ...baseBtcMemoryTable,

    // The witness version is stored at index 150
    witnessVersion: { start: 150, length: 1, end: 151 },

    // Converts the RIPEMD-160 hash into a 'squashed' format of 5-bit integers
    // The squashed format is stored at indexes 151-183
    squashed: { start: 151, length: 32, end: 183 },
}
