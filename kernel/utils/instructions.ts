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
export enum AddressOperation {
    // Base58 encoding
    Base58NetworkByte = "base58-network-byte",
    Base58DoubleSha256 = "base58-double-sha",

    // Bech32 encoding
    Bech32WitnessVersion = "bech32-witness-version",

    // Address generation
    Base58Address = "base58-address",
    Bech32Address = "bech32-address",
    EvmAddress = "evm-address",
}

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
export type InstructionSetName =
    | "MEMORY_SLOT::BTC"
    | "MEMORY_SLOT::SEGWIT_BTC"
    | "MEMORY_SLOT::EVM"
    | "BTC_P2PKH"
    | "BTC_P2SH"
    | "BTC_P2WPKH"
    | "BTC_P2WSH"
    | "EVM"

/**
 * Returns the proper instruction set with flags for a given instruction set name.
 *
 * Note that the instruction are written directly in the code for better readability
 * of the overall memory space management.
 * @param instructionSetName The name of the instruction set.
 * @returns The instruction set with the corresponding flags.
 */
export function getInstructionSet(instructionSetName: InstructionSetName): InstructionWithFlags[] {
    let instructionSet: Instruction[]

    switch (instructionSetName) {
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

// case "RAW_BTC":
//     // prettier-ignore
//     instructionSet = [
//         { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
//         { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
//         { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
//         { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 129, end: 149, length: 20 }, operation: GenericOperation.Ripemd160 },
//     ]
//     break
// case "RAW_EVM":
//     // https://ethereum.stackexchange.com/questions/3542/how-are-ethereum-addresses-generated
//     // prettier-ignore
//     instructionSet = [
//         { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
//         { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  96, length: 64 }, operation: GenericOperation.PublicKey },
//         { inputSlot: { start:  32, end:  96, length: 64 }, outputSlot: { start:  96, end: 128, length: 32 }, operation: GenericOperation.Keccak256 },
//     ]
//     break
// case "BTC_P2PKH_UNCOMPRESSED":
//     // https://en.bitcoin.it/w/images/en/9/9b/PubKeyToAddr.png
//     // prettier-ignore
//     instructionSet = [
//         { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
//         { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
//         { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
//         { inputSlot:                                 null, outputSlot: { start: 129, end: 130, length:  1 }, operation: AddressOperation.Base58NetworkByte },
//         { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 130, end: 150, length: 20 }, operation: GenericOperation.Ripemd160 },
//         { inputSlot: { start: 129, end: 150, length: 21 }, outputSlot: { start: 150, end: 182, length: 32 }, operation: AddressOperation.Base58DoubleSha256 },
//         { inputSlot: { start: 129, end: 154, length: 25 }, outputSlot:                                 null, operation: AddressOperation.Base58Address },
//     ]
//     break
// case "BTC_BECH32_UNCOMPRESSED":
//     // https://en.bitcoin.it/wiki/Bech32
//     // prettier-ignore
//     instructionSet = [
//         { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
//         { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
//         { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
//         { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 130, end: 150, length: 20 }, operation: GenericOperation.Ripemd160 },
//         { inputSlot:                                 null, outputSlot: { start: 150, end: 151, length:  1 }, operation: AddressOperation.Bech32WitnessVersion },
//         { inputSlot: { start: 151, end: 183, length: 32 }, outputSlot:                                 null, operation: AddressOperation.Bech32Address },
//     ]
//     break
// case "EVM":
//     // https://ethereum.stackexchange.com/questions/3542/how-are-ethereum-addresses-generated
//     // prettier-ignore
//     instructionSet = [
//         { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
//         { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  96, length: 64 }, operation: GenericOperation.PublicKey },
//         { inputSlot: { start:  32, end:  96, length: 64 }, outputSlot: { start:  96, end: 128, length: 32 }, operation: GenericOperation.Keccak256 },
//         { inputSlot: { start: 108, end: 128, length: 20 }, outputSlot:                                 null, operation: AddressOperation.EvmAddress },
//     ]
//     break
