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
 * The type definition of the address specific parameters.
 */
export type AddressSpecificParameters = {
    base58NetworkByte?: number
    bech32Hrp?: "bc" | "tb"
    bech32WitnessVersion?: number
}

/**
 * The default address specific parameters.
 */
export const DEFAULT_ADDRESS_SPECIFIC_PARAMETERS: Required<AddressSpecificParameters> = {
    base58NetworkByte: 0x00,
    bech32Hrp: "bc",
    bech32WitnessVersion: 0x00,
}

/**
 * The type definition of the address generator parameters.
 */
export type AddressGeneratorParameters = {
    instructionSetName: InstructionSetName
    randomBytesPoolSize?: number
    addressSpecificParameters?: AddressSpecificParameters
}

/**
 * The `AddressGenerator` class is used to generate a Web3 address from random bytes via a set of
 * specific instructions.
 */
export default class AddressGenerator {
    // Instructions
    private _instructionSet: InstructionWithFlags[]

    // Parameters
    private _isRawInstructionSet: boolean
    private _addressSpecificParameters: Required<AddressSpecificParameters>
    private _publicKeyGenerationMode: PublicKeyGenerationMode

    // Memory
    private _cache: Cache

    // Generators
    private _randomBytesPool: RandomBytesPool

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
     * @param addressSpecificParameters The address specific parameters to use (optional, only
     * for instruction sets that actually generates either a base58 or a Bech32 address,
     * defaults to `DEFAULT_ADDRESS_SPECIFIC_PARAMETERS`).
     * @param randomBytesPoolSize The size of the random bytes pool.
     */
    constructor({
        instructionSetName,
        addressSpecificParameters,
        randomBytesPoolSize = 128,
    }: AddressGeneratorParameters) {
        // Instructions
        this._instructionSet = getInstructionSet(instructionSetName)

        // Parameters
        this._isRawInstructionSet = instructionSetName.includes("RAW")
        this._addressSpecificParameters = {
            ...DEFAULT_ADDRESS_SPECIFIC_PARAMETERS,
            ...addressSpecificParameters,
        }
        this._publicKeyGenerationMode = this._getPublicKeyGenerationMode(
            this._instructionSet[1].outputSlot as MemorySlot
        )

        // Memory
        this._cache = new Cache(getInstructionSetCacheLength(this._instructionSet))

        // Generators
        this._randomBytesPool = new RandomBytesPool(randomBytesPoolSize)

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
                break
            case GenericOperation.PublicKey:
                // TODO: Implement a better algorithm that supports 64 bytes public keys.
                this._secp256k1Algorithm.generate(
                    this._publicKeyGenerationMode === PublicKeyGenerationMode.Compressed
                        ? "compressed"
                        : "uncompressed",
                    this._cache,
                    inputSlot as MemorySlot,
                    outputSlot
                )
                break
            case GenericOperation.Sha256:
                this._sha256Algorithm.hash(this._cache, inputSlot as MemorySlot, outputSlot)
                break
            case GenericOperation.Ripemd160:
                this._ripemd160Algorithm.hash(this._cache, inputSlot as MemorySlot, outputSlot)
                break
            case GenericOperation.Keccak256:
                this._keccak256Algorithm.hash(this._cache, inputSlot as MemorySlot, outputSlot)
                break
        }
    }

    private _executeAddressOperation(
        operation: AddressOperation,
        inputSlot: MemorySlot | null,
        outputSlot: MemorySlot | null
    ): string | undefined {
        switch (operation) {
            // I/O operations
            case AddressOperation.Base58NetworkByte:
                this._cache.writeUint8(this._addressSpecificParameters.base58NetworkByte, outputSlot?.start)
                break
            case AddressOperation.Base58DoubleSha256:
                this._sha256Algorithm.hash(this._cache, inputSlot as MemorySlot, outputSlot as MemorySlot)
                this._sha256Algorithm.hash(this._cache, outputSlot as MemorySlot, outputSlot as MemorySlot)
                break
            case AddressOperation.Bech32WitnessVersion:
                this._cache.writeUint8(this._addressSpecificParameters.bech32WitnessVersion, outputSlot?.start)
                break

            // Address generation
            case AddressOperation.Base58Address:
                return this._base58Encoder.encode(this._cache, inputSlot as MemorySlot)
            case AddressOperation.Bech32Address:
                return this._bech32Encoder.encode(
                    this._addressSpecificParameters.bech32WitnessVersion,
                    this._addressSpecificParameters.bech32Hrp,
                    this._cache,
                    inputSlot as MemorySlot
                )
            case AddressOperation.EvmAddress:
                return `0x${this._cache.readHexString(inputSlot?.start, inputSlot?.length)}`
        }
    }

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
                    break
                }
            } else {
                const address = this._executeAddressOperation(
                    instruction.operation as AddressOperation,
                    instruction.inputSlot,
                    instruction.outputSlot
                )

                if (!this._isRawInstructionSet && instruction.isEnd && address) {
                    result = address
                    break
                }
            }
        }

        return result
    }
}
