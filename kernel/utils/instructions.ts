import Cache from "#kernel/utils/cache"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"

/**
 * The type definition of a memory slot, containing the start, end and length of the slot.
 */
export type MemorySlot = {
    start: number
    end: number
    length: number
}

/**
 * The type definition of a memory slot extended with a cache instance.
 */
export type MemorySlotWithCache = Partial<MemorySlot> & { cache: Cache }

/**
 * An enum containing all the generic operations for the instruction sets,
 * such as hashing, encoding, etc.
 */
export enum GenericOperation {
    PrivateKey = "private-key",
    PublicKey = "public-key",
    Sha256 = "sha-256",
    Ripemd160 = "ripemd-160",
    Keccak256 = "keccak-256",
}

/**
 * An enum containing all the specific address operations for the non-raw instruction sets,
 * such as base58 encoding, bech32 encoding, etc.
 */
export enum AddressOperation {}
// // Base58 encoding
// Base58NetworkByte = "base58-network-byte",
// Base58DoubleSha256 = "base58-double-sha",

// // Bech32 encoding
// Bech32WitnessVersion = "bech32-witness-version",

// // Address generation
// Base58Address = "base58-address",
// Bech32Address = "bech32-address",
// EvmAddress = "evm-address",

/**
 * The type definition of an instruction, based on a generic or specific address operation,
 * its input slot to read the data from, and its output slot to write the result to.
 */
export type Instruction = {
    inputSlot: MemorySlot | null
    outputSlot: MemorySlot | null
    operation: GenericOperation | AddressOperation
}

/**
 * The type definition of an instruction extended with its pre-computed flags.
 */
export type InstructionWithFlags = Instruction & {
    isGenericOperation: boolean
    isEnd: boolean
}

/**
 * The type definition of the available instruction sets.
 */
export type InstructionSetName = "MEMORY_SLOT::BTC33" | "MEMORY_SLOT::BTC65" | "MEMORY_SLOT::EVM64"

/**
 * Returns the proper instruction set with flags for a given instruction set name,
 * the number in the instruction set name represents the length of the public key.
 *
 * Note that the instruction are written directly in the code for better readability
 * of the overall memory space management.
 *
 * @param instructionSetName The name of the instruction set.
 * @returns The instruction set with the corresponding flags.
 * @sources
 * - [SecretScan.org](https://secretscan.org/)
 * - [Hiro.so](https://www.hiro.so/blog/understanding-the-differences-between-bitcoin-address-formats-when-developing-your-app)
 */
export function getInstructionSet(instructionSetName: InstructionSetName): InstructionWithFlags[] {
    let instructionSet: Instruction[]

    switch (instructionSetName) {
        case "MEMORY_SLOT::BTC33":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  97, end: 117, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::BTC65":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 129, end: 149, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::EVM64":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  96, length: 64 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  96, length: 64 }, outputSlot: { start:  96, end: 128, length: 32 }, operation: GenericOperation.Keccak256 },
            ]
            break
        default:
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INSTRUCTION_SET_NOT_FOUND, undefined, {
                    instructionSetName,
                })
            )
    }

    // Flags pre-computation:
    // - `isGenericOperation` flag based on whether the operation is from the `Operation` enum or not.
    // - `isEnd` flag based on whether the instruction is the final one in the instruction set.
    return instructionSet.map((instruction) => ({
        ...instruction,
        isGenericOperation: Object.values(GenericOperation).includes(instruction.operation as GenericOperation),
        isEnd: instruction === instructionSet[instructionSet.length - 1],
    }))
}

/**
 * Gets the needed cache length for a given instruction set,
 * by finding the maximum end of the input and output slots.
 */
export function getInstructionSetCacheLength(instructionSet: Instruction[]): number {
    return Math.max(
        ...instructionSet.map((instruction) => instruction.inputSlot?.end || 0),
        ...instructionSet.map((instruction) => instruction.outputSlot?.end || 0)
    )
}
