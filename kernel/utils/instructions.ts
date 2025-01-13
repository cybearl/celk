import Cache from "#kernel/utils/cache"
import { KernelErrors } from "#lib/utils/errors"
import { stringifyError } from "@cybearl/cypack"

/**
 * The type definition of a memory slot, containing the start, end and length of the slot.
 */
export type MemorySlot = {
    start: number
    end: number
    length: number
}

/**
 * The type definition of a memory slot extended with a cache instance (Cache Instance = `CI`),
 */
export type MemorySlotWithCI = Partial<MemorySlot> & { cache: Cache }

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

    // Opcodes
    OP_1 = "OP_1", // 0x51 = 81
    OP_PUSHBYTES_32 = "OP_PUSHBYTES_32", // 0x20 = 32
    OP_PUSHBYTES_33 = "OP_PUSHBYTES_33", // 0x21 = 33
    OP_CHECKSIG = "OP_CHECKSIG", // 0xAC = 172
}

/**
 * An enum containing all the specific address operations for the non-raw instruction sets,
 * such as base58 encoding, bech32 encoding, etc.
 */
export enum AddressOperation {
    BtcP2shPrefix = "btc-p2sh-prefix", // Pushing "0014" at the beginning of the ripemd160 hash
    BtcBase58NetworkByte = "btc-base58-network-byte", // Pushing network byte at the beginning of the ripemd160 hash
    BtcBase58Encoding = "base58-encoding",
    BtcBech32Encoding = "btc-bech32-encoding",
    BtcTaprootTweak = "btc-taproot-tweak", // Tweaking the public key for taproot
    BtcBech32mEncoding = "btc-bech32m-encoding", // = "btc-bech32-encoding", with enforced version > 0
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
 * An enum containing all the available instruction sets to generate addresses from,
 * such as BTC33, BTC65, EVM64, etc.
 */
export enum InstructionSet {
    MEMORY_SLOT_BTC33_P2PKH = "MEMORY_SLOT::BTC33::P2PKH",
    MEMORY_SLOT_BTC65_P2PKH = "MEMORY_SLOT::BTC65::P2PKH",
    MEMORY_SLOT_BTC33_P2SH = "MEMORY_SLOT::BTC33::P2SH",
    MEMORY_SLOT_BTC65_P2SH = "MEMORY_SLOT::BTC65::P2SH",
    MEMORY_SLOT_BTC33_P2WPKH = "MEMORY_SLOT::BTC33::P2WPKH", // = "MEMORY_SLOT::BTC33::P2PKH"
    MEMORY_SLOT_BTC65_P2WPKH = "MEMORY_SLOT::BTC65::P2WPKH", // = "MEMORY_SLOT::BTC65::P2PKH"
    MEMORY_SLOT_BTC33_P2WSH = "MEMORY_SLOT::BTC33::P2WSH",
    MEMORY_SLOT_BTC65_P2WSH = "MEMORY_SLOT::BTC65::P2WSH",
    MEMORY_SLOT_BTC_P2TR = "MEMORY_SLOT::BTC::P2TR",
    MEMORY_SLOT_EVM64 = "MEMORY_SLOT::EVM64",
    BTC33_P2PKH = "BTC33::P2PKH",
    BTC65_P2PKH = "BTC65::P2PKH",
    BTC33_P2SH = "BTC33::P2SH",
    BTC65_P2SH = "BTC65::P2SH",
    BTC33_P2WPKH = "BTC33::P2WPKH",
    BTC65_P2WPKH = "BTC65::P2WPKH",
    BTC33_P2WSH = "BTC33::P2WSH",
    BTC65_P2WSH = "BTC65::P2WSH",
    // BTC33_P2TR = "BTC::P2TR", // TODO
    EVM64 = "EVM64",
}

/**
 * An array containing all the available instruction sets.
 */
export const instructionSets: InstructionSet[] = Object.values(InstructionSet)

/**
 * An array containing all the available memory instruction sets.
 */
export const memoryInstructionSets: InstructionSet[] = [
    ...instructionSets.filter((name) => name.startsWith("MEMORY_SLOT")),
]

/**
 * An array containing all the available address instruction sets.
 */
export const addressInstructionSets: InstructionSet[] = [
    ...instructionSets.filter((name) => !name.startsWith("MEMORY_SLOT")),
]

/**
 * Returns the proper instructions with flags for a given instruction set.
 * The number in the instruction set represents the length of the public key.
 *
 * Note that the instruction are written directly in the code for better readability
 * of the overall memory space management.
 *
 * @param instructionSet The name (enum) of the instruction set to get the instruction set with flags for.
 * @returns The instruction set with the corresponding flags.
 * @sources
 * - [SecretScan.org](https://secretscan.org/)
 * - [Hiro.so](https://www.hiro.so/blog/understanding-the-differences-between-bitcoin-address-formats-when-developing-your-app)
 * - [RFC TOOLS](https://www.rfctools.com/bitcoin-address-test-tool/)
 * - [LearnMeABitcoin](https://learnmeabitcoin.com/technical/script/p2tr/)
 * - [Oghenovo Usiwoma](https://dev.to/eunovo/more-on-taproot-41g8)
 * - [Bitcoin StackExchange](https://bitcoin.stackexchange.com/questions/116384/what-are-the-steps-to-convert-a-private-key-to-a-taproot-address)
 */
export function getInstructions(instructionSet: InstructionSet): InstructionWithFlags[] {
    let instructions: Instruction[]

    switch (instructionSet) {
        case "MEMORY_SLOT::BTC33::P2PKH":
        case "MEMORY_SLOT::BTC33::P2WPKH":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  97, end: 117, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::BTC65::P2PKH":
        case "MEMORY_SLOT::BTC65::P2WPKH":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 129, end: 149, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::BTC33::P2SH":
            // prettier-ignore
            instructions = [
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
            instructions = [
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
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
            ]
            break
        case "MEMORY_SLOT::BTC65::P2WSH":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
            ]
            break
        case "MEMORY_SLOT::BTC::P2TR":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  33, end:  65, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: AddressOperation.BtcTaprootTweak },
                { inputSlot: { start:  33, end:  65, length: 32 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 129, end: 149, length: 20 }, operation: GenericOperation.Ripemd160 },
            ]
            break
        case "MEMORY_SLOT::EVM64":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  96, length: 64 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  96, length: 64 }, outputSlot: { start:  96, end: 128, length: 32 }, operation: GenericOperation.Keccak256 },
            ]
            break
        case "BTC33::P2PKH":
            // prettier-ignore
            instructions = [
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
            instructions = [
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
            instructions = [
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
            instructions = [
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
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  65, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  65, length: 33 }, outputSlot: { start:  65, end:  97, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  65, end:  97, length: 32 }, outputSlot: { start:  97, end: 117, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start:  97, end: 117, length: 20 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        case "BTC65::P2WPKH":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  97, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  97, length: 65 }, outputSlot: { start:  97, end: 129, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  97, end: 129, length: 32 }, outputSlot: { start: 129, end: 149, length: 20 }, operation: GenericOperation.Ripemd160 },
                { inputSlot: { start: 129, end: 149, length: 20 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        case "BTC33::P2WSH":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot:                                 null, outputSlot: { start:  32, end:  33, length:  1 }, operation: GenericOperation.OP_PUSHBYTES_33 },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  33, end:  66, length: 33 }, operation: GenericOperation.PublicKey },
                { inputSlot:                                 null, outputSlot: { start:  66, end:  67, length:  1 }, operation: GenericOperation.OP_CHECKSIG },
                { inputSlot: { start:  32, end:  67, length: 35 }, outputSlot: { start:  68, end: 100, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start:  68, end: 100, length: 32 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        case "BTC65::P2WSH":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot:                                 null, outputSlot: { start:  32, end:  33, length:  1 }, operation: GenericOperation.OP_PUSHBYTES_33 },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  33, end:  98, length: 65 }, operation: GenericOperation.PublicKey },
                { inputSlot:                                 null, outputSlot: { start:  98, end:  99, length:  1 }, operation: GenericOperation.OP_CHECKSIG },
                { inputSlot: { start:  32, end:  99, length: 67 }, outputSlot: { start: 100, end: 132, length: 32 }, operation: GenericOperation.Sha256 },
                { inputSlot: { start: 100, end: 132, length: 32 }, outputSlot:                                 null, operation: AddressOperation.BtcBech32Encoding },
            ]
            break
        // case "BTC::P2TR":
        //     // TODO
        //     // prettier-ignore
        //     instructions = [

        //     ]
        //     break
        case "EVM64":
            // prettier-ignore
            instructions = [
                { inputSlot:                                 null, outputSlot: { start:   0, end:  32, length: 32 }, operation: GenericOperation.PrivateKey },
                { inputSlot: { start:   0, end:  32, length: 32 }, outputSlot: { start:  32, end:  96, length: 64 }, operation: GenericOperation.PublicKey },
                { inputSlot: { start:  32, end:  96, length: 64 }, outputSlot: { start:  96, end: 128, length: 32 }, operation: GenericOperation.Keccak256 },
                { inputSlot: { start: 108, end: 128, length: 20 }, outputSlot:                                 null, operation: AddressOperation.HexEncoding },
            ]
            break
        default:
            throw new Error(
                stringifyError(KernelErrors.INSTRUCTION_SET_NOT_FOUND, undefined, {
                    instructionSet,
                })
            )
    }

    // Verify that the lengths are correct
    instructions.forEach((instruction) => {
        const inputSlotCalculatedLength = (instruction.inputSlot?.end ?? 0) - (instruction.inputSlot?.start ?? 0)
        if (instruction.inputSlot && instruction.inputSlot.length !== inputSlotCalculatedLength) {
            throw new Error(
                stringifyError(KernelErrors.INVALID_INSTRUCTION_LENGTH, undefined, {
                    instructionSet,
                    instructionOperation: instruction.operation,
                    inputSlotLength: instruction.inputSlot.length,
                    inputSlotCalculatedLength,
                })
            )
        }

        const outputSlotCalculatedLength = (instruction.outputSlot?.end ?? 0) - (instruction.outputSlot?.start ?? 0)
        if (instruction.outputSlot && instruction.outputSlot.length !== outputSlotCalculatedLength) {
            throw new Error(
                stringifyError(KernelErrors.INVALID_INSTRUCTION_LENGTH, undefined, {
                    instructions,
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
    return instructions.map((instruction) => ({
        ...instruction,
        isGenericOperation: Object.values(GenericOperation).includes(instruction.operation as GenericOperation),
        isEnd: instruction === instructions[instructions.length - 1],
    }))
}

/**
 * Get the needed cache length for the given list of instructions
 * by finding the maximum end of the input and output slots.
 */
export function getInstructionsNeededCacheLength(instructions: Instruction[]): number {
    return Math.max(
        ...instructions.map((instruction) => instruction.inputSlot?.end || 0),
        ...instructions.map((instruction) => instruction.outputSlot?.end || 0)
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
