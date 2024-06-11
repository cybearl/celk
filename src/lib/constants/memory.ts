/**
 * Type for a single memory slot space.
 */
export type MemorySlotSpace = {
    offset: number;
    bytes: number;
    end: number;
}

/**
 * Type for a single read-only memory slot.
 */
export type ReadOnlyMemorySlot = {
    readFrom: MemorySlotSpace
}

/**
 * Type for a single write-only memory slot.
 */
export type WriteOnlyMemorySlot = {
    writeTo: MemorySlotSpace
}

/**
 * Type for a single memory slot.
 */
export type MemorySlot = {
    readFrom: MemorySlotSpace
    writeTo: MemorySlotSpace
}

/**
 * Type for the Bitcoin memory table.
 */
export type BitcoinMemoryTable = {
    /** Step 0: Private key */
    PRK: WriteOnlyMemorySlot;
    /** Step 1: Public key. */
    PBK: MemorySlot;
    /** Step 2: `SHA-256` hash. */
    SHA: MemorySlot;
    /** Step 3: `RIPEMD-160` hash. */
    RMD: MemorySlot;
    /** Step 4: `SHA-256` hash. */
    SC1: MemorySlot;
    /** Step 5: `SHA-256` hash. */
    SC2: MemorySlot;
    /** Step 6: Checksum. */
    CHK: MemorySlot;
    /** Step 7: Address. */
    ADR: ReadOnlyMemorySlot;
}

/**
 * Bitcoin memory table used across the entire system.
 * - Table size: 186 bytes.
 * - See [here](...) for more information.
 * - And [here](https://www.rfctools.com/bitcoin-address-test-tool/) to see the steps in action.
 *
 * **Note**: The `end` property is exclusive.
 */
export const BITCOIN_MEMORY_TABLE: BitcoinMemoryTable = {
    PRK: {
        writeTo: { offset: 0, bytes: 32, end: 32 }
    },
    PBK: {
        readFrom: { offset: 0, bytes: 32, end: 32 },
        // We keep 65 bytes for the public key, even if it's compressed.
        writeTo: { offset: 32, bytes: 65, end: 97 }
    },
    SHA: {
        // `bytes` and `end` vary depending on if the public key is compressed
        // or not, so it is dynamically added during the generation process.
        readFrom: { offset: 32, bytes: -1, end: -1 },
        writeTo: { offset: 97, bytes: 32, end: 129 }
    },
    RMD: {
        readFrom: { offset: 97, bytes: 32, end: 129 },
        writeTo: { offset: 130, bytes: 20, end: 150 }
    },
    SC1: {
        // Reading one more byte at the beginning for the network byte
        readFrom: { offset: 129, bytes: 20, end: 150 },
        writeTo: { offset: 154, bytes: 32, end: 186 }
    },
    SC2: {
        readFrom: { offset: 154, bytes: 32, end: 186 },
        writeTo: { offset: 154, bytes: 32, end: 186 }
    },
    CHK: {
        readFrom: { offset: 154, bytes: 4, end: 158 },
        // Write the checksum to the end of the `RIPEMD-160` hash,
        // Which gives `NETWORK_BYTE + RIPEMD-160 + CHECKSUM`
        writeTo: { offset: 150, bytes: 4, end: 154 }
    },
    ADR: {
        readFrom: { offset: 129, bytes: 25, end: 154 }
    }
};

/**
 * Type for the Ethereum memory table.
 */
export type EthereumMemoryTable = {
    /** Step 0: Private key */
    PRK: WriteOnlyMemorySlot;
    /** Step 1: Public key. */
    PBK: MemorySlot;
    /** Step 2: `KECCAK-256` hash. */
    KEK: MemorySlot;
    /** Step 3: Checksum. */
    CHK: MemorySlot;
    /** Step 4: Address. */
    ADR: ReadOnlyMemorySlot;
}

/**
 * Ethereum memory table used across the entire system.
 * - Table size: 134 bytes.
 * - See [here](...) for more information.
 * - And [here](https://www.rfctools.com/ethereum-address-test-tool/) to see the steps in action.
 *
 * **Note**: The `end` property is exclusive.
 */
export const ETHEREUM_MEMORY_TABLE: EthereumMemoryTable = {
    PRK: {
        writeTo: { offset: 0, bytes: 32, end: 32 }
    },
    PBK: {
        readFrom: { offset: 0, bytes: 32, end: 32 },
        // With Ethereum, the public key is always 64 bytes (uncompressed without the `04` prefix).
        writeTo: { offset: 32, bytes: 64, end: 96 }
    },
    KEK: {
        readFrom: { offset: 32, bytes: 64, end: 96 },
        writeTo: { offset: 96, bytes: 32, end: 128 }
    },
    CHK: {
        // Last 20 bytes of the `KECCAK-256` hash
        readFrom: { offset: 96, bytes: 20, end: 116 },
        // Write as UTF-8 string for letter capitalization check
        writeTo: { offset: 116, bytes: 20, end: 136 }
    },
    ADR: {
        readFrom: { offset: 116, bytes: 20, end: 136 }
    }
};