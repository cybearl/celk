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
    getPrivateKeyOutputMemorySlot,
    getLongestInstructionOperationNameLength,
} from "#kernel/utils/instructions"
import externalLogger from "#lib/utils/external_logger"
import PrivateKeyGenerator, { PrivateKeyGeneratorOptions } from "#kernel/generators/private_key_generator"

/**
 * The type definition of the public key generation mode.
 */
export type PublicKeyGenerationMode = "compressed" | "uncompressed" | "evm"

/**
 * The type definition of the address generator options.
 */
export type AddressGeneratorOptions = {
    privateKeyGeneratorOptions?: PrivateKeyGeneratorOptions
    base58NetworkByte?: number
    bech32Hrp?: string
    bech32WitnessVersion?: number
    enableDebugging?: boolean
}

/**
 * The default address generator options.
 */
export const defaultAddressGeneratorOptions: Required<AddressGeneratorOptions> = {
    privateKeyGeneratorOptions: {},
    base58NetworkByte: 0x00,
    bech32Hrp: "bc",
    bech32WitnessVersion: 0x00,
    enableDebugging: false,
}

/**
 * The `AddressGenerator` class is used to generate a Web3 address from random bytes via a set of
 * specific instructions.
 */
export default class AddressGenerator {
    // Instructions
    private _instructionSet!: InstructionWithFlags[]

    // Pointer, used only when executing instructions one by one
    private _instructionPointer = 0

    // Parameters
    private _options!: Required<AddressGeneratorOptions>

    // Pre-computed flags / values
    private _isMemorySlotInstructionSet!: boolean
    private _publicKeyGenerationMode!: "compressed" | "uncompressed" | "evm"
    private _longestInstructionOperationNameLength!: number

    // Memory
    cache!: Cache

    // Generators
    private _privateKeyGenerator!: PrivateKeyGenerator

    // Algorithms
    private _secp256k1Algorithm!: Secp256k1Algorithm
    private _sha256Algorithm!: Sha256Algorithm
    private _ripemd160Algorithm!: Ripemd160Algorithm
    private _keccak256Algorithm!: Keccak256Algorithm

    // Encoders
    private _base58Encoder!: Base58Encoder
    private _bech32Encoder!: Bech32Encoder

    /**
     * Creates a new `AddressGenerator` instance.
     * @param instructionSetName The name of the instruction set to use.
     * @param options The address generator options:
     * - `privateKeyGeneratorOptions` The private key generator options (bounds, rejection limits, etc.).
     * - `base58NetworkByte` The base58 network byte (only for base58 addresses, defaults to 0x00).
     * - `bech32Hrp` The bech32 human-readable part (only for bech32 addresses, defaults to "bc").
     * - `bech32WitnessVersion` The bech32 witness version (only for bech32 addresses, from 0 to 16, defaults to 0).
     * - `randomBytesPoolSize` The random bytes pool size (defaults to 1,024).
     * - `enableDebugging` Whether to enable debugging (defaults to `false`).
     */
    constructor(instructionSetName: InstructionSetName, options?: AddressGeneratorOptions) {
        this.setParams(instructionSetName, options)
    }

    /**
     * Set the options for the address generator.
     * @param instructionSetName The name of the instruction set to use.
     * @param options The address generator options:
     * - `privateKeyGeneratorOptions` The private key generator options (bounds, rejection limits, etc.).
     * - `base58NetworkByte` The base58 network byte (only for base58 addresses, defaults to 0x00).
     * - `bech32Hrp` The bech32 human-readable part (only for bech32 addresses, defaults to "bc").
     * - `bech32WitnessVersion` The bech32 witness version (only for bech32 addresses, from 0 to 16, defaults to 0).
     * - `randomBytesPoolSize` The random bytes pool size (defaults to 1,024).
     * - `enableDebugging` Whether to enable debugging (defaults to `false`).
     */
    setParams(instructionSetName: InstructionSetName, options?: AddressGeneratorOptions): void {
        // Instructions
        this._instructionSet = getInstructionSet(instructionSetName)

        // Parameters
        this._options = { ...defaultAddressGeneratorOptions, ...options }

        // Pre-computed flags
        this._isMemorySlotInstructionSet = instructionSetName.startsWith("MEMORY_SLOT::")
        this._publicKeyGenerationMode = instructionSetName.includes("33")
            ? "compressed"
            : instructionSetName.includes("65")
              ? "uncompressed"
              : "evm"
        this._longestInstructionOperationNameLength = getLongestInstructionOperationNameLength(this._instructionSet)

        // Memory
        this.cache = new Cache(getInstructionSetCacheLength(this._instructionSet))

        // Generators
        const privateKeyMemorySlot = getPrivateKeyOutputMemorySlot(this._instructionSet)
        this._privateKeyGenerator = new PrivateKeyGenerator(
            { ...privateKeyMemorySlot, cache: this.cache },
            this._options.privateKeyGeneratorOptions
        )

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
     * Logs the instruction and its result to the console.
     * @param instruction The instruction to log.
     * @param result The result of the instruction, if any.
     */
    private _logInstruction(instruction: InstructionWithFlags, result: MemorySlot | string | null): void {
        let toLog: string

        // Print the result as a string in the case of a non-memory slot instruction set
        if (!this._isMemorySlotInstructionSet && instruction.isEnd && result) {
            toLog = result as string
        } else {
            switch (instruction.operation) {
                default:
                    toLog = this.cache.readHexString(
                        instruction.outputSlot?.start as number,
                        instruction.outputSlot?.length
                    )
            }
        }

        externalLogger.info(
            `Instruction: ${instruction.operation.padStart(this._longestInstructionOperationNameLength, " ")} | Result: ${toLog}`
        )
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
                this._privateKeyGenerator.generate()
                break
            case GenericOperation.PublicKey:
                // EVM is not supported by the current secp256k1 library
                const mode = this._publicKeyGenerationMode === "evm" ? "compressed" : this._publicKeyGenerationMode
                this._secp256k1Algorithm.generate(
                    mode,
                    { cache: this.cache, ...inputSlot },
                    { cache: this.cache, ...outputSlot }
                )
                break
            case GenericOperation.Sha256:
                this._sha256Algorithm.hash({ cache: this.cache, ...inputSlot }, { cache: this.cache, ...outputSlot })
                break
            case GenericOperation.Ripemd160:
                this._ripemd160Algorithm.hash({ cache: this.cache, ...inputSlot }, { cache: this.cache, ...outputSlot })
                break
            case GenericOperation.Keccak256:
                this._keccak256Algorithm.hash({ cache: this.cache, ...inputSlot }, { cache: this.cache, ...outputSlot })
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
            case AddressOperation.BtcP2shPrefix:
                this.cache.writeUint16(0x0014, outputSlot?.start)
                break
            // // Base58 encoding
            // case AddressOperation.Base58NetworkByte:
            //     this.cache.writeUint8(this._options.base58NetworkByte, outputSlot?.start)
            //     break
            // case AddressOperation.Base58DoubleSha256:
            //     this._sha256Algorithm.hash({ cache: this.cache, ...inputSlot }, { cache: this.cache, ...outputSlot })
            //     this._sha256Algorithm.hash({ cache: this.cache, ...outputSlot }, { cache: this.cache, ...outputSlot })
            //     break

            // // Bech32 encoding
            // case AddressOperation.Bech32WitnessVersion:
            //     this.cache.writeUint8(this._options.bech32WitnessVersion, outputSlot?.start)
            //     break

            // // Address generation
            // case AddressOperation.Base58Address:
            //     return this._base58Encoder.encode(this.cache, inputSlot as MemorySlot)
            // case AddressOperation.Bech32Address:
            //     return this._bech32Encoder.encode(
            //         this._options.bech32WitnessVersion,
            //         this._options.bech32Hrp,
            //         this.cache,
            //         inputSlot as MemorySlot
            //     )
            // case AddressOperation.EvmAddress:
            //     return `0x${this.cache.readHexString(inputSlot?.start, inputSlot?.length)}`
        }

        return undefined
    }

    /**
     * Resets the instruction pointer to the beginning of the instruction set.
     */
    resetInstructionPointer(): void {
        this._instructionPointer = 0
    }

    /**
     * Executes a single instruction from the instruction set and increments the instruction pointer,
     * used for debugging and testing purposes, not recommended for production use as it is slower.
     */
    executeInstruction(): MemorySlot | string | null {
        const instruction = this._instructionSet[this._instructionPointer]

        console.log(instruction, this._instructionPointer)

        let result: MemorySlot | string | null = null

        if (instruction.isGenericOperation) {
            this._executeGenericOperation(
                instruction.operation as GenericOperation,
                instruction.inputSlot,
                instruction.outputSlot as MemorySlot
            )

            if (instruction.outputSlot) result = instruction.outputSlot
        } else {
            const address = this._executeAddressOperation(
                instruction.operation as AddressOperation,
                instruction.inputSlot,
                instruction.outputSlot
            )

            if (address) result = address
        }

        if (this._options.enableDebugging) this._logInstruction(instruction, result)
        this._instructionPointer++

        return result
    }

    /**
     * Executes the instructions in the instruction set.
     * @returns Either the latest memory slot in the case of an instruction set ending with a memory slot,
     * or the address string otherwise.
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

                if (instruction.outputSlot) result = instruction.outputSlot
            } else {
                const address = this._executeAddressOperation(
                    instruction.operation as AddressOperation,
                    instruction.inputSlot,
                    instruction.outputSlot
                )

                if (address) result = address
            }

            if (this._options.enableDebugging) this._logInstruction(instruction, result)
        }

        return result
    }
}
