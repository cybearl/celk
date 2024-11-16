import Keccak256Algorithm from "#kernel/algorithms/keccak256"
import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Secp256k1Algorithm, { PublicKeyGenerationMode } from "#kernel/algorithms/secp256k1"
import Sha256Algorithm from "#kernel/algorithms/sha256"
import Cache from "#kernel/utils/cache"
import Base58Encoder from "#kernel/encoders/base58"
import Bech32Encoder from "#kernel/encoders/bech32"
import { MemorySlot } from "#kernel/utils/instructions"
import RandomBytesPool from "#kernel/generators/random_bytes_pool"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"

export type GeneratorParameters = {
    memoryTable: keyof typeof memoryTables
    randomBytesPoolSize?: number
}

/**
 * The `AddressGenerator` class is used to generate a Web3 address from random bytes via a set of
 * specific instructions.
 */
export default class AddressGenerator {
    // Memory
    private memoryTable: MemoryTable
    private cache: Cache

    // Generators
    private randomBytesPool: RandomBytesPool

    // Algorithms
    private secp256k1Algorithm: Secp256k1Algorithm
    private sha256Algorithm: Sha256Algorithm
    private ripemd160Algorithm: Ripemd160Algorithm
    private keccak256Algorithm: Keccak256Algorithm

    // Encoders
    private base58Encoder: Base58Encoder
    private bech32Encoder: Bech32Encoder

    /**
     *
     * @param param0
     */
    constructor({ memoryTable, randomBytesPoolSize = 128 }: GeneratorParameters) {
        // Memory
        this.memoryTable = memoryTables[memoryTable]
        this.cache = new Cache(getMemoryTableLength(this.memoryTable))

        // Generators
        this.randomBytesPool = new RandomBytesPool(randomBytesPoolSize)

        // Algorithms
        this.secp256k1Algorithm = new Secp256k1Algorithm()
        this.sha256Algorithm = new Sha256Algorithm()
        this.ripemd160Algorithm = new Ripemd160Algorithm()
        this.keccak256Algorithm = new Keccak256Algorithm()

        // Encoders
        this.base58Encoder = new Base58Encoder()
        this.bech32Encoder = new Bech32Encoder()
    }

    /**
     * Executes the corresponding operation of a slot in a memory table.
     * @param operation The operation to execute.
     * @param inputSlot The input slot to read the data from (optional, defaults to the operation slot).
     * @param outputSlot The output slot to write the data to (optional, defaults to the operation slot).
     * @param inputData The data to write to the input slot (optional, if needed for specific operations).
     * @returns The result of the operation.
     */
    // private executeMemorySlotOperation(
    //     operation: MemoryTableOperation,
    //     inputSlot = this.memoryTable[operation],
    //     outputSlot = this.memoryTable[operation],
    //     inputData?: Uint8Array
    // ) {
    //     switch (operation) {
    //         case "privateKey":
    //             this.cache.writeUint8Array(this.randomBytesPool.pool, outputSlot.start, outputSlot.length)
    //             this.randomBytesPool.increment(outputSlot.length)
    //             break
    //         case "publicKey":
    //             this.secp256k1Algorithm.generate(this.publicKeyGenerationMode, this.cache, inputSlot, outputSlot)
    //             break
    //         case "sha256":
    //             this.sha256Algorithm.hash(this.cache, inputSlot, outputSlot)
    //             break
    //         case "doubleSha256":
    //             this.sha256Algorithm.hash(this.cache, inputSlot, outputSlot)
    //             this.sha256Algorithm.hash(this.cache, outputSlot, outputSlot)
    //             break
    //         case "ripemd160":
    //             this.ripemd160Algorithm.hash(this.cache, inputSlot, outputSlot)
    //             break
    //         case "keccak256":
    //             this.keccak256Algorithm.hash(this.cache, inputSlot, outputSlot)
    //             break
    //         case "base58_networkByte":
    //             // Writes the first byte of the input data as the network byte
    //             this.cache.writeUint8(inputData?.[0] ?? 0x00, outputSlot.start)
    //             break
    //         case "base58_checksum":
    //             // Double SHA-256 hash already ends up with its first 4 bytes at the checksum
    //             // position, so, no need for any additional operation here
    //             break
    //         case "base58_address":
    //             // TODO
    //             break
    //         case "bech32_witnessVersion":
    //             // Writes the first byte of the input data as the witness version
    //             this.cache.writeUint8(inputData?.[0] ?? 0x00, outputSlot.start)
    //             break
    //         case "bech32_address":
    //             // TODO
    //             break
    //         case "evm_publicKey":
    //             // TODO
    //             break
    //         case "evm_address":
    //             // TODO
    //             break
    //         default:
    //             throw new Error(
    //                 cyGeneral.errors.stringifyError(KernelErrors.UNSUPPORTED_MEMORY_TABLE_OPERATION, undefined, {
    //                     operation,
    //                 })
    //             )
    //     }
    // }
}
