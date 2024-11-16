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
 * An enum containing all the available generic operations for the instruction sets.
 */
export enum Operation {
    // Private-public key generation
    PrivateKey = "private-key",
    PublicKey = "public-key",
    // Algorithms
    Sha256 = "sha-256",
    DoubleSha256 = "double-sha-256",
    Ripemd160 = "ripemd-160",
    Keccak256 = "keccak-256",
}

/**
 * The type definition of an instruction, based on a generic / custom operation
 * and a output memory slot.
 */
export type Instruction = {
    outputSlot: MemorySlot
    operation: Operation | string
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
    switch (instructionSetName) {
        // https://en.bitcoin.it/w/images/en/9/9b/PubKeyToAddr.png
        case "BTC_BASE58_UNCOMPRESSED":
            // prettier-ignore
            return [
                { outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { outputSlot: { start:  32, end:  97, length: 65 }, operation: Operation.PublicKey },
                { outputSlot: { start:  97, end: 129, length: 32 }, operation: Operation.Sha256 },
                { outputSlot: { start: 129, end: 130, length:  1 }, operation: "base58-network-byte" },
                { outputSlot: { start: 130, end: 150, length: 20 }, operation: Operation.Ripemd160 },
                { outputSlot: { start: 150, end: 182, length: 32 }, operation: Operation.DoubleSha256 },
                // Final address slot
                { outputSlot: { start: 129, end: 154, length: 25 }, operation: "base58-address" },
            ]
        // https://en.bitcoin.it/w/images/en/9/9b/PubKeyToAddr.png
        case "BTC_BASE58_COMPRESSED":
            // prettier-ignore
            return [
                { outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { outputSlot: { start:  32, end:  65, length: 33 }, operation: Operation.PublicKey },
                { outputSlot: { start:  65, end:  97, length: 32 }, operation: Operation.Sha256 },
                { outputSlot: { start:  97, end:  98, length:  1 }, operation: "base58-network-byte" },
                { outputSlot: { start:  98, end: 118, length: 20 }, operation: Operation.Ripemd160 },
                { outputSlot: { start: 118, end: 150, length: 32 }, operation: Operation.DoubleSha256 },
                // Final address slot
                { outputSlot: { start:  97, end: 122, length: 25 }, operation: "base58-address" },
            ]
        // https://en.bitcoin.it/wiki/Bech32
        case "BTC_BECH32_UNCOMPRESSED":
            // prettier-ignore
            return [
                { outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { outputSlot: { start:  32, end:  97, length: 65 }, operation: Operation.PublicKey },
                { outputSlot: { start:  97, end: 129, length: 32 }, operation: Operation.Sha256 },
                { outputSlot: { start: 130, end: 150, length: 20 }, operation: Operation.Ripemd160 },
                { outputSlot: { start: 150, end: 151, length:  1 }, operation: "bech32-witness-version" },
                // Final address slot
                { outputSlot: { start: 151, end: 183, length: 32 }, operation: "bech32-address" },
            ]
        // https://en.bitcoin.it/wiki/Bech32
        case "BTC_BECH32_COMPRESSED":
            // prettier-ignore
            return [
                { outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { outputSlot: { start:  32, end:  65, length: 33 }, operation: Operation.PublicKey },
                { outputSlot: { start:  65, end:  97, length: 32 }, operation: Operation.Sha256 },
                { outputSlot: { start:  97, end: 117, length: 20 }, operation: Operation.Ripemd160 },
                { outputSlot: { start: 117, end: 118, length:  1 }, operation: "bech32-witness-version" },
                // Final address slot
                { outputSlot: { start: 118, end: 150, length: 32 }, operation: "bech32-address" },
            ]
        // https://ethereum.stackexchange.com/questions/3542/how-are-ethereum-addresses-generated
        case "EVM":
            // prettier-ignore
            return [
                { outputSlot: { start:   0, end:  32, length: 32 }, operation: Operation.PrivateKey },
                { outputSlot: { start:  32, end:  96, length: 64 }, operation: Operation.PublicKey },
                { outputSlot: { start:  96, end: 128, length: 32 }, operation: Operation.Keccak256 },
                // Final address slot
                { outputSlot: { start: 108, end: 128, length: 20 }, operation: "evm-address" },
            ]
        default:
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INSTRUCTION_SET_NOT_FOUND, undefined, {
                    instructionSetName,
                })
            )
    }
}
