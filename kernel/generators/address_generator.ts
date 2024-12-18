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
import { cyGeneral } from "@cybearl/cypack"
import { KernelErrors } from "#lib/utils/errors"

/**
 * The type definition of the public key generation mode.
 */
export type PublicKeyGenerationMode = "compressed" | "uncompressed" | "evm"

/**
 * The type definition of the address generator options.
 */
export type AddressGeneratorOptions = {
    injectedHexPrivateKey?: string
    privateKeyGeneratorOptions?: PrivateKeyGeneratorOptions
    btcBase58NetworkByte?: number
    btcBech32Hrp?: string
    btcBech32WitnessVersion?: number
    enableDebugging?: boolean
}

/**
 * The default address generator options.
 */
export const defaultAddressGeneratorOptions: Required<Omit<AddressGeneratorOptions, "injectedHexPrivateKey">> = {
    privateKeyGeneratorOptions: {},
    btcBase58NetworkByte: 0x00,
    btcBech32Hrp: "bc",
    btcBech32WitnessVersion: 0x00,
    enableDebugging: false,
}

/**
 * The `AddressGenerator` class is used to generate a Web3 address from random bytes via a set of
 * specific instructions.
 */
export default class AddressGenerator {
    // Instructions
    instructionSetName!: InstructionSetName
    private _instructionSet!: InstructionWithFlags[]

    // Pointer, used only when executing instructions one by one
    private _instructionPointer = 0

    // Parameters
    private _options = defaultAddressGeneratorOptions

    // Pre-computed flags / values
    private _isMemorySlotInstructionSet!: boolean
    private _publicKeyGenerationMode!: "compressed" | "uncompressed" | "evm"
    private _longestInstructionOperationNameLength!: number
    private _injectedPrivateKey?: Cache

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
     * - `injectedHexPrivateKey`: The hexadecimal representation of the private key to inject (optional, used for testing,
     *   note that it prevents the private key generator from executing).
     * - `privateKeyGeneratorOptions`: The private key generator options (bounds, rejection limits, etc.).
     * - `btcBase58NetworkByte`: The base58 network byte (only for Bitcoin Base58-based addresses, defaults to 0x00).
     * - `btcBech32Hrp`: The bech32 human-readable part (only for Bitcoin bech32-based addresses, defaults to "bc").
     * - `btcBech32WitnessVersion`: The bech32 witness version (only for Bitcoin bech32-based addresses, from 0 to 16,
     *   defaults to 0).
     * - `enableDebugging`: Whether to enable debugging (defaults to `false`).
     */
    constructor(instructionSetName: InstructionSetName, options?: AddressGeneratorOptions) {
        this.setInstructionSet(instructionSetName)
        this.setOptions(options ?? defaultAddressGeneratorOptions)
    }

    /**
     * Set the options for the address generator.
     * @param instructionSetName The name of the instruction set to use.
     */
    setInstructionSet(instructionSetName: InstructionSetName): void {
        // Instructions
        this.instructionSetName = instructionSetName
        this._instructionSet = getInstructionSet(instructionSetName)

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
        this._privateKeyGenerator = new PrivateKeyGenerator({ ...privateKeyMemorySlot, cache: this.cache })

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
     * Set the options for the address generator.
     * @param options The address generator options:
     * - `injectedHexPrivateKey`: The hexadecimal representation of the private key to inject (optional, used for testing,
     *   note that it prevents the private key generator from executing).
     * - `privateKeyGeneratorOptions`: The private key generator options (bounds, rejection limits, etc.).
     * - `btcBase58NetworkByte`: The base58 network byte (only for Bitcoin Base58-based addresses, defaults to 0x00).
     * - `btcBech32Hrp`: The bech32 human-readable part (only for Bitcoin bech32-based addresses, defaults to "bc").
     * - `btcBech32WitnessVersion`: The bech32 witness version (only for Bitcoin bech32-based addresses, from 0 to 16,
     *   defaults to 0).
     * - `enableDebugging`: Whether to enable debugging (defaults to `false`).
     */
    setOptions(options: AddressGeneratorOptions): void {
        if (options.enableDebugging) {
            externalLogger.info(`Initialized Address Generator with debug mode enabled:`)
            externalLogger.info(`Instruction Set: [${this._instructionSet.map((i) => i.operation).join(", ")}]`)
        }

        // Converts the injected private key to a cache instance to improve performances even
        // via injection
        if (options.injectedHexPrivateKey) {
            this._injectedPrivateKey = Cache.fromHexString(options?.injectedHexPrivateKey)
        }

        if (options.privateKeyGeneratorOptions) {
            this._privateKeyGenerator.setOptions(options.privateKeyGeneratorOptions)
        }

        this._options = { ...this._options, ...options }
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

                    toLog += ` | Bytes: ${instruction.outputSlot?.length}`
            }
        }

        const isGenericOp = instruction.isGenericOperation ? "generic" : "address"
        const paddedOp = `"${instruction.operation}"`.padStart(this._longestInstructionOperationNameLength + 2, " ")

        const logMessage = `>> Instruction (${isGenericOp}): ${paddedOp} | Result: ${toLog}`

        if (instruction.isEnd) externalLogger.silly(logMessage)
        else externalLogger.debug(logMessage)
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
                if (!this._injectedPrivateKey) this._privateKeyGenerator.generate()
                else this.cache.writeUint8Array(this._injectedPrivateKey, outputSlot.start, outputSlot.length)
                break
            case GenericOperation.PublicKey:
                this._secp256k1Algorithm.generate(
                    this._publicKeyGenerationMode,
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
                this.cache.writeUint8(0x00, outputSlot?.start)
                this.cache.writeUint8(0x14, (outputSlot?.start ?? 0) + 1)
                break
            case AddressOperation.BtcBase58NetworkByte:
                this.cache.writeUint8(this._options.btcBase58NetworkByte, outputSlot?.start)
                break
            case AddressOperation.BtcBase58Encoding:
                return this._base58Encoder.encode(this.cache, inputSlot as MemorySlot)
            case AddressOperation.BtcP2wshOpPush33Prefix:
                this.cache.writeUint8(0x21, outputSlot?.start)
                break
            case AddressOperation.BtcP2wshOpChecksigSuffix:
                this.cache.writeUint8(0xac, outputSlot?.start)
                break
            case AddressOperation.BtcBech32Encoding:
                return this._bech32Encoder.encode(
                    this._options.btcBech32WitnessVersion,
                    this._options.btcBech32Hrp,
                    this.cache,
                    inputSlot as MemorySlot
                )
            case AddressOperation.HexEncoding:
                return `0x${this.cache.readHexString(inputSlot?.start, inputSlot?.length)}`
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
     * @param customIndex The custom index of the instruction to execute, replaces the instruction pointer.
     */
    executeInstruction(customIndex?: number): MemorySlot | string | null {
        const instruction = this._instructionSet[customIndex ?? this._instructionPointer]
        if (!instruction) {
            throw new Error(
                cyGeneral.errors.stringifyError(
                    KernelErrors.INVALID_INSTRUCTION_INDEX,
                    "The given instruction index leads to either a non-existent or invalid instruction."
                )
            )
        }

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

        if (!customIndex) {
            if (instruction.isEnd) this._instructionPointer = 0
            else this._instructionPointer++
        }

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
