import Keccak256Algorithm from "#kernel/algorithms/keccak256"
import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Secp256k1Algorithm from "#kernel/algorithms/secp256k1"
import Sha256Algorithm from "#kernel/algorithms/sha256"
import Cache from "#kernel/utils/cache"
import Base58Encoder from "#kernel/encoders/base58"
import Bech32Encoder from "#kernel/encoders/bech32"
import {
    Instruction,
    InstructionSetName,
    MemorySlot,
    Operation,
    getInstructionSet,
    getInstructionSetCacheLength,
} from "#kernel/utils/instructions"
import RandomBytesPool from "#kernel/generators/random_bytes_pool"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"

/**
 * The type definition of the public key generation mode.
 */
export enum PublicKeyGenerationMode {
    Compressed = "compressed",
    Uncompressed = "uncompressed",
    Evm = "evm",
}

/**
 * The type definition of the address generator parameters.
 */
export type AddressGeneratorParameters = {
    instructionSetName: InstructionSetName
    randomBytesPoolSize?: number
}

/**
 * The `AddressGenerator` class is used to generate a Web3 address from random bytes via a set of
 * specific instructions.
 */
export default class AddressGenerator {
    // Memory
    private instructionSet: Instruction[]
    private publicKeyGenerationMode: PublicKeyGenerationMode
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
    constructor({ instructionSetName, randomBytesPoolSize = 128 }: AddressGeneratorParameters) {
        // Memory
        this.instructionSet = getInstructionSet(instructionSetName)
        this.publicKeyGenerationMode = this._getPublicKeyGenerationMode(this.instructionSet[1].outputSlot)
        this.cache = new Cache(getInstructionSetCacheLength(this.instructionSet))

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
     * Gets the public key generation mode based on the memory slot length.
     * @param publicKeySlot The memory slot containing the public key.
     * @returns The public key generation mode.
     */
    private _getPublicKeyGenerationMode(publicKeySlot: MemorySlot): PublicKeyGenerationMode {
        switch (publicKeySlot.length) {
            case 33:
                return PublicKeyGenerationMode.Compressed
            case 64:
                return PublicKeyGenerationMode.Evm
            case 65:
                return PublicKeyGenerationMode.Uncompressed
            default:
                throw new Error(
                    cyGeneral.errors.stringifyError(KernelErrors.UNSUPPORTED_PUBLIC_KEY_LENGTH, undefined, {
                        length: publicKeySlot.length,
                    })
                )
        }
    }

    /**
     * Reads from an input memory slot, executes the corresponding operation based on the `Operation`
     * enum and writes the result to an output memory slot.
     * @param operation The operation to execute.
     * @param inputSlot The input memory slot to read the data from.
     * @param outputSlot The output memory slot to write the result to.
     */
    private _executeOperation(operation: Operation, inputSlot: MemorySlot, outputSlot: MemorySlot) {
        switch (operation) {
            case Operation.PrivateKey:
                this.cache.writeUint8Array(this.randomBytesPool.pool, outputSlot.start, outputSlot.length)
                this.randomBytesPool.increment(outputSlot.length)
                break
            case Operation.PublicKey:
                this.secp256k1Algorithm.generate(
                    this.publicKeyGenerationMode === PublicKeyGenerationMode.Compressed ? "compressed" : "uncompressed",
                    this.cache,
                    inputSlot,
                    outputSlot
                )
                break
            case Operation.Sha256:
                this.sha256Algorithm.hash(this.cache, inputSlot, outputSlot)
                break
            case Operation.DoubleSha256:
                this.sha256Algorithm.hash(this.cache, inputSlot, outputSlot)
                this.sha256Algorithm.hash(this.cache, outputSlot, outputSlot)
                break
            case Operation.Ripemd160:
                this.ripemd160Algorithm.hash(this.cache, inputSlot, outputSlot)
                break
            case Operation.Keccak256:
                this.keccak256Algorithm.hash(this.cache, inputSlot, outputSlot)
                break
        }
    }
}
