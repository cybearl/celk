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
const baseMemoryTable = {
    // The private key is stored at indexes 0-31.
    privateKey: { start: 0, length: 32, end: 32 },

    // The public key is stored at indexes 32-96.
    // - Uncompressed public key: 65 bytes
    // - Compressed public key: 33 bytes
    // We still allocate 65 bytes to support both.
    publicKey: { start: 32, length: 65, end: 97 },

    // The SHA-256 hash of the public key is stored at indexes 97-127.
    sha256: { start: 97, length: 32, end: 129 },

    // The RIPEMD-160 hash of the SHA-256 hash is stored at indexes 129-149.
    ripemd160: { start: 129, length: 20, end: 149 },
}

/**
 * The memory table indexes the data stored in a single Cache instance (= Uint8Array)
 * for the legacy address generation.
 *
 * This table is only compatible with legacy addresses.
 *
 * Note that the `end` index is exclusive.
 */
const legacyMemoryTable = {
    ...baseMemoryTable,
}

/**
 * The SegWit memory table indexes the data stored in a single Cache instance (= Uint8Array)
 * for the SegWit address generation.
 *
 * This table is only compatible with SegWit addresses.
 *
 * Note that the `end` index is exclusive.
 */
const segWitMemoryTable = {
    ...baseMemoryTable,
}

export default memoryTable
