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
 * An enum containing all the available generic operations for the instruction sets,
 * such as hashing, encoding, etc.
 */
export enum Operation {
    PrivateKey = "private-key",
    PublicKey = "public-key",
    Sha256 = "sha-256",
    DoubleSha256 = "double-sha-256",
    Ripemd160 = "ripemd-160",
    Keccak256 = "keccak-256",
}

/**
 * The type definition of an instruction, based on a generic / custom operation, its input slot
 * to read the data from, and its output slot to write the result to.
 */
export type Instruction = {
    inputSlot: MemorySlot | null
    outputSlot: MemorySlot | null
    operation: Operation | string
    isStandardOperation: boolean
}

/**
 * The type definition of the available instruction sets.
 */
export type InstructionSetName =
    | "BTC_BASE58_UNCOMPRESSED"
    | "BTC_BASE58_COMPRESSED"
    | "BTC_BECH32_UNCOMPRESSED"
    | "BTC_BECH32_COMPRESSED"
    | "EVM"

/**
 * Returns the proper instruction set based on the instruction set name.
 *
 * Note that the instruction are written directly in the code for better readability
 * of the overall memory space management.
 * @param instructionSetName The name of the instruction set.
 * @returns The instruction set.
 */
export function getInstructionSet(instructionSetName: InstructionSetName): Instruction[] {
    let instructionSet: Omit<Instruction, "isStandardOperation">[]

    switch (instructionSetName) {
        case "BTC_BASE58_UNCOMPRESSED":
            // https://en.bitcoin.it/w/images/en/9/9b/PubKeyToAddr.png
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: Operation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: Operation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start: 129, end: 130, length:  1 }, operation: "base58-network-byte" },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 130, end: 150, length: 20 }, operation: Operation.Ripemd160 },
                { inputSlot: { start: 129, end: 150, length: 21 }, outputSlot: { start: 150, end: 182, length: 32 }, operation: Operation.DoubleSha256 },
                { inputSlot: { start: 129, end: 154, length: 25 }, outputSlot:                                 null, operation: "base58-address" },
            ]
            break
        case "BTC_BASE58_COMPRESSED":
            // https://en.bitcoin.it/w/images/en/9/9b/PubKeyToAddr.png
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: Operation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: Operation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start:  97, end:  98, length:  1 }, operation: "base58-network-byte" },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  98, end: 118, length: 20 }, operation: Operation.Ripemd160 },
                { inputSlot: { start:  97, end: 118, length: 21 }, outputSlot: { start: 118, end: 150, length: 32 }, operation: Operation.DoubleSha256 },
                { inputSlot: { start:  97, end: 122, length: 25 }, outputSlot:                                 null, operation: "base58-address" },
            ]
            break
        case "BTC_BECH32_UNCOMPRESSED":
            // https://en.bitcoin.it/wiki/Bech32
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: Operation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: Operation.Sha256 },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 130, end: 150, length: 20 }, operation: Operation.Ripemd160 },
                { inputSlot:                                 null, outputSlot: { start: 150, end: 151, length:  1 }, operation: "bech32-witness-version" },
                { inputSlot: { start: 151, end: 183, length: 32 }, outputSlot:                                 null, operation: "bech32-address" },
            ]
            break
        case "BTC_BECH32_COMPRESSED":
            // https://en.bitcoin.it/wiki/Bech32
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: Operation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: Operation.Sha256 },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  97, end: 117, length: 20 }, operation: Operation.Ripemd160 },
                { inputSlot:                                 null, outputSlot: { start: 117, end: 118, length:  1 }, operation: "bech32-witness-version" },
                { inputSlot: { start: 118, end: 150, length: 32 }, outputSlot:                                 null, operation: "bech32-address" },
            ]
            break
        case "EVM":
            // https://ethereum.stackexchange.com/questions/3542/how-are-ethereum-addresses-generated
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  96, length: 64 }, operation: Operation.PublicKey },
                { inputSlot: { start:  32, end:  96, length: 64 }, outputSlot: { start:  96, end: 128, length: 32 }, operation: Operation.Keccak256 },
                { inputSlot: { start: 108, end: 128, length: 20 }, outputSlot:                                 null, operation: "evm-address" },
            ]
            break
        default:
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INSTRUCTION_SET_NOT_FOUND, undefined, {
                    instructionSetName,
                })
            )
    }

    // Travel through the instruction set and add the `isStandardOperation` flag based on
    // whether the operation is from the `Operation` enum or not.
    return instructionSet.map((instruction) => ({
        ...instruction,
        isStandardOperation: Object.values(Operation).includes(instruction.operation as Operation),
    }))
}

/**
 * Gets the needed cache length for a given instruction set,
 * by finding the maximum end of the memory slots.
 */
export function getInstructionSetCacheLength(instructionSet: Instruction[]): number {
    return Math.max(...instructionSet.map((instruction) => instruction.outputSlot?.end ?? 0))
}
