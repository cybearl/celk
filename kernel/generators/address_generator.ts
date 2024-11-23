import Keccak256Algorithm from "#kernel/algorithms/keccak256"
import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Secp256k1Algorithm from "#kernel/algorithms/secp256k1"
import Sha256Algorithm from "#kernel/algorithms/sha256"
import Cache from "#kernel/utils/cache"
import Base58Encoder from "#kernel/encoders/base58"
import Bech32Encoder from "#kernel/encoders/bech32"
import {
    InstructionSetName,
    MemorySlot,
    GenericOperation,
    getInstructionSet,
    getInstructionSetCacheLength,
    InstructionWithFlags,
    AddressOperation,
    MemorySlotWithCache,
} from "#kernel/utils/instructions"
import externalLogger from "#lib/utils/external_logger"
import PrivateKeyGenerator from "#kernel/generators/private_key_generator"

/**
 * The type definition of the public key generation mode.
 */
export type PublicKeyGenerationMode = "compressed" | "uncompressed" | "evm"

/**
 * The type definition of the address generator options.
 * @param base58NetworkByte The base58 network byte (only for base58 addresses, defaults to 0x00).
 * @param bech32Hrp The bech32 human-readable part (only for bech32 addresses, defaults to "bc").
 * @param bech32WitnessVersion The bech32 witness version (only for bech32 addresses, from 0 to 16, defaults to 0).
 * @param randomBytesPoolSize The random bytes pool size (defaults to 1,024).
 * @param enableDebugging Whether to enable debugging (defaults to `false`).
 * @param fixedPrivateKeyInputCache A fixed private key to use formatted as a cache instance,
 * mostly for testing purposes (should be a 32-byte Cache, defaults to `null`).
 */
export type Options = {
    base58NetworkByte?: number
    bech32Hrp?: string
    bech32WitnessVersion?: number
    enableDebugging?: boolean
    fixedPrivateKeyInputCache?: Cache | null
}

/**
 * The default address generator options.
 */
export const DEFAULT_OPTIONS: Required<Options> = {
    base58NetworkByte: 0x00,
    bech32Hrp: "bc",
    bech32WitnessVersion: 0x00,
    enableDebugging: false,
    fixedPrivateKeyInputCache: null,
}

/**
 * The `AddressGenerator` class is used to generate a Web3 address from random bytes via a set of
 * specific instructions.
 */
export default class AddressGenerator {
    // Instructions
    private _instructionSet: InstructionWithFlags[]

    // Parameters
    private _options: Required<Options>

    // Pre-computed flags
    private _isRawInstructionSet: boolean
    private _publicKeySlot: MemorySlot

    // Memory
    private _cache: Cache
    private _latestPrivateKeySlot: MemorySlot | null

    // Generators
    private _privateKeyGenerator: PrivateKeyGenerator

    // Algorithms
    private _secp256k1Algorithm: Secp256k1Algorithm
    private _sha256Algorithm: Sha256Algorithm
    private _ripemd160Algorithm: Ripemd160Algorithm
    private _keccak256Algorithm: Keccak256Algorithm

    // Encoders
    private _base58Encoder: Base58Encoder
    private _bech32Encoder: Bech32Encoder

    /**
     * Initializes the `AddressGenerator` instance with the given parameters.
     * @param instructionSetName The name of the instruction set to use.
     * @param publicKeyGenerationMode The public key generation mode (compressed (33 bytes), uncompressed (65 bytes), or EVM (64 bytes)).
     * @param options The address generator options.
     */
    constructor(
        instructionSetName: InstructionSetName,
        publicKeyGenerationMode: PublicKeyGenerationMode,
        options?: Options
    ) {
        // Instructions
        this._instructionSet = getInstructionSet(instructionSetName)

        // Parameters
        this._options = { ...DEFAULT_OPTIONS, ...options }

        // Pre-computed flags
        this._isRawInstructionSet = instructionSetName.includes("RAW")
        this._publicKeySlot = this._getPublicKeySlot(publicKeyGenerationMode)

        // Memory
        this._cache = new Cache(getInstructionSetCacheLength(this._instructionSet))
        this._latestPrivateKeySlot = null

        // Generators
        this._privateKeyGenerator = new PrivateKeyGenerator(this._options.randomBytesPoolSize)

        // Algorithms
        this._secp256k1Algorithm = new Secp256k1Algorithm()
        this._sha256Algorithm = new Sha256Algorithm()
        this._ripemd160Algorithm = new Ripemd160Algorithm()
        this._keccak256Algorithm = new Keccak256Algorithm()

        // Encoders
        this._base58Encoder = new Base58Encoder()
        this._bech32Encoder = new Bech32Encoder()
    }

    /**
     * Gets the public key slot based on the public key generation mode.
     * @param publicKeyGenerationMode The public key generation mode (compressed (33 bytes), uncompressed (65 bytes), or EVM (64 bytes)).
     * @returns The public key slot.
     */
    private _getPublicKeySlot(publicKeyGenerationMode: PublicKeyGenerationMode): MemorySlot {
        switch (publicKeyGenerationMode) {
            case "compressed":
                return { start: 32, end: 65, length: 33 }
            case "uncompressed":
                return { start: 32, end: 97, length: 65 }
            case "evm":
                return { start: 32, end: 96, length: 64 }
        }
    }

    /**
     * Logs the instruction and its result to the console.
     * @param instruction The instruction to log.
     * @param result The result of the instruction, if any.
     */
    private _logInstruction(instruction: InstructionWithFlags, result: MemorySlot | string | null): void {
        let toLog: string

        if (!this._isRawInstructionSet && instruction.isEnd && result) {
            toLog = result as string
        } else {
            switch (instruction.operation) {
                case GenericOperation.PrivateKey:
                    toLog = this._randomBytesPool.pool.readHexString(
                        this._randomBytesPool.memorySlot.start as number,
                        this._randomBytesPool.memorySlot.length
                    )

                    break
                default:
                    toLog = this._cache.readHexString(
                        instruction.outputSlot?.start as number,
                        instruction.outputSlot?.length
                    )
            }
        }

        externalLogger.info(`Instruction: ${instruction.operation} | Result: ${toLog}`)
    }

    /**
     * Reads from an input memory slot, executes the corresponding generic operation based
     * on the `GenericOperation` enum and writes the result to an output memory slot.
     * @param operation The generic operation to execute.
     * @param inputSlot The input memory slot to read the data from (can be `null` for the `PrivateKey` operation).
     * @param outputSlot The output memory slot to write the result to.
     */
    private _executeGenericOperation(
        operation: GenericOperation,
        inputSlot: MemorySlot | null,
        outputSlot: MemorySlot
    ): void {
        switch (operation) {
            case GenericOperation.PrivateKey:
                this._randomBytesPool.increment(outputSlot.length)
                this._latestPrivateKeySlot = this._randomBytesPool.memorySlot
                break
            case GenericOperation.PublicKey:
                const internalInputSlot: MemorySlotWithCache = this._options.fixedPrivateKeyInputCache
                    ? { cache: this._options.fixedPrivateKeyInputCache, ...inputSlot }
                    : { cache: this._randomBytesPool.pool, ...inputSlot }

                this._secp256k1Algorithm.generate(
                    this._publicKeyGenerationMode === PublicKeyGenerationMode.Compressed
                        ? "compressed"
                        : "uncompressed",
                    internalInputSlot,
                    { cache: this._cache, ...outputSlot }
                )
                break
            case GenericOperation.Sha256:
                this._sha256Algorithm.hash({ cache: this._cache, ...inputSlot }, { cache: this._cache, ...outputSlot })
                break
            case GenericOperation.Ripemd160:
                this._ripemd160Algorithm.hash(
                    { cache: this._cache, ...inputSlot },
                    { cache: this._cache, ...outputSlot }
                )
                break
            case GenericOperation.Keccak256:
                this._keccak256Algorithm.hash(
                    { cache: this._cache, ...inputSlot },
                    { cache: this._cache, ...outputSlot }
                )
                break
        }
    }

    /**
     * Executes an address operation based on the `AddressOperation` enum.
     * @param operation The address operation to execute.
     * @param inputSlot The input memory slot to read the data from.
     * @param outputSlot The output memory slot to write the result to.
     * @returns The address string if the operation is an address generation operation, `undefined` otherwise.
     */
    private _executeAddressOperation(
        operation: AddressOperation,
        inputSlot: MemorySlot | null,
        outputSlot: MemorySlot | null
    ): string | undefined {
        switch (operation) {
            // Base58 encoding
            case AddressOperation.Base58NetworkByte:
                this._cache.writeUint8(this._options.base58NetworkByte, outputSlot?.start)
                break
            case AddressOperation.Base58DoubleSha256:
                this._sha256Algorithm.hash({ cache: this._cache, ...inputSlot }, { cache: this._cache, ...outputSlot })
                this._sha256Algorithm.hash({ cache: this._cache, ...outputSlot }, { cache: this._cache, ...outputSlot })
                break

            // Bech32 encoding
            case AddressOperation.Bech32WitnessVersion:
                this._cache.writeUint8(this._options.bech32WitnessVersion, outputSlot?.start)
                break

            // Address generation
            case AddressOperation.Base58Address:
                return this._base58Encoder.encode(this._cache, inputSlot as MemorySlot)
            case AddressOperation.Bech32Address:
                return this._bech32Encoder.encode(
                    this._options.bech32WitnessVersion,
                    this._options.bech32Hrp,
                    this._cache,
                    inputSlot as MemorySlot
                )
            case AddressOperation.EvmAddress:
                return `0x${this._cache.readHexString(inputSlot?.start, inputSlot?.length)}`
        }
    }

    /**
     * Executes the instructions in the instruction set.
     * @returns The address string if the instruction set is not raw, the latest private key slot if it is raw,
     * or `null` if the instruction set could not run but did not throw an error.
     */
    executeInstructions(): MemorySlot | string | null {
        let result: MemorySlot | string | null = null

        for (const instruction of this._instructionSet) {
            if (instruction.isGenericOperation) {
                this._executeGenericOperation(
                    instruction.operation as GenericOperation,
                    instruction.inputSlot,
                    instruction.outputSlot as MemorySlot
                )

                if (this._isRawInstructionSet && instruction.isEnd) {
                    result = instruction.outputSlot as MemorySlot
                }
            } else {
                const address = this._executeAddressOperation(
                    instruction.operation as AddressOperation,
                    instruction.inputSlot,
                    instruction.outputSlot
                )

                if (!this._isRawInstructionSet && instruction.isEnd && address) {
                    result = address
                }
            }

            if (this._options.enableDebugging) this._logInstruction(instruction, result)
        }

        return result
    }

    /**
     * Gets the latest private key slot.
     * @returns The latest private key slot.
     */
    get latestPrivateKeySlot(): MemorySlot | null {
        return this._latestPrivateKeySlot
    }
}
