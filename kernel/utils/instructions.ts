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
export type MemorySlotWithCacheInstance = Partial<MemorySlot> & { cache: Cache }

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
    BtcP2shPrefix = "btc-p2sh-prefix", // Pushing "0014" at the beginning of the ripemd160 hash
    BtcBase58NetworkByte = "btc-base58-network-byte", // Pushing network byte at the beginning of the ripemd160 hash
    BtcBase58Encoding = "base58-encoding",
    BtcP2wshOpPush33Prefix = "btc-p2wsh-op-push33-prefix", // Pushing "21" at the beginning of the sha256 hash
    BtcP2wshOpChecksigSuffix = "btc-p2wsh-op-checksig-suffix", // Pushing "ac" at the end of the sha256 hash
    BtcBech32Encoding = "btc-bech32-encoding",
    HexEncoding = "hex-encoding",
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
    | "MEMORY_SLOT::BTC33"
    | "MEMORY_SLOT::BTC65"
    | "MEMORY_SLOT::BTC33::P2SH"
    | "MEMORY_SLOT::BTC65::P2SH"
    | "MEMORY_SLOT::BTC33::P2WPKH"
    | "MEMORY_SLOT::BTC65::P2WPKH"
    | "MEMORY_SLOT::BTC33::P2WSH"
    | "MEMORY_SLOT::BTC65::P2WSH"
    | "MEMORY_SLOT::EVM64"
    | "BTC33::P2PKH"
    | "BTC65::P2PKH"
    | "BTC33::P2SH"
    | "BTC65::P2SH"
    | "BTC33::P2WPKH"
    | "BTC65::P2WPKH"
    | "BTC33::P2WSH"
    | "BTC65::P2WSH"
    | "EVM64"

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
 * - [RFC TOOLS](https://www.rfctools.com/bitcoin-address-test-tool/)
 */
export function getInstructionSet(instructionSetName: InstructionSetName): InstructionWithFlags[] {
    let instructionSet: Instruction[]

    switch (instructionSetName) {
        case "MEMORY_SLOT::BTC33":
        case "MEMORY_SLOT::BTC33::P2WPKH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  97, end: 117, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::BTC65":
        case "MEMORY_SLOT::BTC65::P2WPKH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 129, end: 149, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::BTC33::P2SH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start:  97, end:  99, length:  2 }, operation: AddressOperation.BtcP2shPrefix },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  99, end: 119, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start:  97, end: 119, length: 22 }, outputSlot: { start: 119, end: 151, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 119, end: 151, length: 32 }, outputSlot: { start: 151, end: 171, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::BTC65::P2SH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start: 129, end: 131, length:  2 }, operation: AddressOperation.BtcP2shPrefix },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 131, end: 151, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start: 129, end: 151, length: 22 }, outputSlot: { start: 151, end: 183, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 151, end: 183, length: 32 }, outputSlot: { start: 183, end: 203, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::BTC33::P2WSH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
            ]
            break
        case "MEMORY_SLOT::BTC65::P2WSH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
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
        case "BTC33::P2PKH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start:  97, end:  98, length:  1 }, operation: AddressOperation.BtcBase58NetworkByte },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  98, end: 118, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start:  97, end: 118, length: 21 }, outputSlot: { start: 118, end: 150, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 118, end: 150, length: 32 }, outputSlot: { start: 118, end: 150, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  97, end: 122, length: 25 }, outputSlot:                                 null, operation: AddressOperation.BtcBase58Encoding },
            ]
            break
        case "BTC65::P2PKH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start: 129, end: 130, length:  1 }, operation: AddressOperation.BtcBase58NetworkByte },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 130, end: 150, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start: 129, end: 150, length: 21 }, outputSlot: { start: 150, end: 182, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 150, end: 182, length: 32 }, outputSlot: { start: 150, end: 182, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 129, end: 154, length: 25 }, outputSlot:                                 null, operation: AddressOperation.BtcBase58Encoding },
            ]
            break
        case "BTC33::P2SH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start:  97, end:  99, length:  2 }, operation: AddressOperation.BtcP2shPrefix },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  99, end: 119, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start:  97, end: 119, length: 22 }, outputSlot: { start: 119, end: 151, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start: 151, end: 152, length:  1 }, operation: AddressOperation.BtcBase58NetworkByte },
                { inputSlot: { start: 119, end: 151, length: 32 }, outputSlot: { start: 152, end: 172, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start: 151, end: 172, length: 21 }, outputSlot: { start: 172, end: 204, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 172, end: 204, length: 32 }, outputSlot: { start: 172, end: 204, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 151, end: 176, length: 25 }, outputSlot:                                 null, operation: AddressOperation.BtcBase58Encoding },
            ]
            break
        case "BTC65::P2SH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start: 129, end: 131, length:  2 }, operation: AddressOperation.BtcP2shPrefix },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 131, end: 151, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start: 129, end: 151, length: 22 }, outputSlot: { start: 151, end: 183, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot:                                 null, outputSlot: { start: 183, end: 184, length:  1 }, operation: AddressOperation.BtcBase58NetworkByte },
                { inputSlot: { start: 151, end: 183, length: 32 }, outputSlot: { start: 184, end: 204, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start: 183, end: 204, length: 21 }, outputSlot: { start: 204, end: 236, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 204, end: 236, length: 32 }, outputSlot: { start: 204, end: 236, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 183, end: 208, length: 25 }, outputSlot:                                 null, operation: AddressOperation.BtcBase58Encoding },
            ]
            break
        case "BTC33::P2WPKH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  97, end: 117, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start:  97, end: 117, length: 20 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        case "BTC65::P2WPKH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 129, end: 149, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start: 129, end: 149, length: 20 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        case "BTC33::P2WSH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot:                                 null, outputSlot: { start:  32, end:  33, length:  1 }, operation: AddressOperation.BtcP2wshOpPush33Prefix },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  33, end:  66, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot:                                 null, outputSlot: { start:  66, end:  67, length:  1 }, operation: AddressOperation.BtcP2wshOpChecksigSuffix },
                { inputSlot: { start:  32, end:  67, length: 35 }, outputSlot: { start:  68, end: 100, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  68, end: 100, length: 32 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        case "BTC65::P2WSH":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot:                                 null, outputSlot: { start:  32, end:  33, length:  1 }, operation: AddressOperation.BtcP2wshOpPush33Prefix },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  33, end:  98, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot:                                 null, outputSlot: { start:  98, end:  99, length:  1 }, operation: AddressOperation.BtcP2wshOpChecksigSuffix },
                { inputSlot: { start:  32, end:  99, length: 67 }, outputSlot: { start: 100, end: 132, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 100, end: 132, length: 32 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        case "EVM64":
            // prettier-ignore
            instructionSet = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  96, length: 64 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  96, length: 64 }, outputSlot: { start:  96, end: 128, length: 32 }, operation: GenericOperation.Keccak256 },
                { inputSlot: { start: 108, end: 128, length: 20 }, outputSlot:                                 null, operation: AddressOperation.HexEncoding },
            ]
            break
        default:
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INSTRUCTION_SET_NOT_FOUND, undefined, {
                    instructionSetName,
                })
            )
    }

    // Verify that the lengths are correct
    instructionSet.forEach((instruction) => {
        const inputSlotCalculatedLength = (instruction.inputSlot?.end ?? 0) - (instruction.inputSlot?.start ?? 0)
        if (instruction.inputSlot && instruction.inputSlot.length !== inputSlotCalculatedLength) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_INSTRUCTION_LENGTH, undefined, {
                    instructionSetName,
                    instructionOperation: instruction.operation,
                    inputSlotLength: instruction.inputSlot.length,
                    inputSlotCalculatedLength,
                })
            )
        }

        const outputSlotCalculatedLength = (instruction.outputSlot?.end ?? 0) - (instruction.outputSlot?.start ?? 0)
        if (instruction.outputSlot && instruction.outputSlot.length !== outputSlotCalculatedLength) {
            throw new Error(
                cyGeneral.errors.stringifyError(KernelErrors.INVALID_INSTRUCTION_LENGTH, undefined, {
                    instructionSetName,
                    instructionOperation: instruction.operation,
                    outputSlotLength: instruction.outputSlot.length,
                    outputSlotCalculatedLength,
                })
            )
        }
    })

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
 * Get the needed cache length for a given instruction set,
 * by finding the maximum end of the input and output slots.
 */
export function getInstructionSetCacheLength(instructionSet: Instruction[]): number {
    return Math.max(
        ...instructionSet.map((instruction) => instruction.inputSlot?.end || 0),
        ...instructionSet.map((instruction) => instruction.outputSlot?.end || 0)
    )
}

/**
 * Get the private key output memory slot from a given instruction set.
 * @param instructionSet The instruction set to get the private key output memory slot from.
 * @returns The private key output memory slot.
 */
export function getPrivateKeyOutputMemorySlot(instructionSet: Instruction[]): MemorySlot {
    return instructionSet.find((instruction) => instruction.operation === GenericOperation.PrivateKey)!.outputSlot!
}

/**
 * Get the longest instruction operation name length from a given instruction set, for logging padding purposes.
 * @param instructionSet The instruction set to get the longest instruction name length from.
 * @returns The longest instruction name length.
 */
export function getLongestInstructionOperationNameLength(instructionSet: Instruction[]): number {
    return Math.max(...instructionSet.map((instruction) => instruction.operation.length))
}
