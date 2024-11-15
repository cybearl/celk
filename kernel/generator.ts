import Cache from "#kernel/cache"
import { MemorySlot, MemoryTable, MemoryTableOperation, getMemoryTableLength, memoryTables } from "#kernel/memory"
import RandomBytesPool from "#kernel/random_bytes_pool"
import { KernelErrors } from "#lib/utils/errors"
import { cyGeneral } from "@cybearl/cypack"

export type GeneratorParameters = {
    memoryTable: keyof typeof memoryTables
    randomBytesPoolSize?: number
}

/**
 * The `Generator` class is used to generate a Web3 address from random bytes via a set of
 * specific instructions.
 */
export default class Generator {
    /**
     * The currently used memory table.
     */
    private memoryTable: MemoryTable

    /**
     * The cache used to store the data for each operation of the generation process.
     */
    private cache: Cache

    /**
     * The pool of random bytes used for the generation process.
     */
    private randomBytesPool: RandomBytesPool

    /**
     *
     * @param param0
     */
    constructor({ memoryTable, randomBytesPoolSize = 128 }: GeneratorParameters) {
        this.memoryTable = memoryTables[memoryTable]
        this.cache = new Cache(getMemoryTableLength(this.memoryTable))
        this.randomBytesPool = new RandomBytesPool(randomBytesPoolSize)
    }

    /**
     * Executes the corresponding operation of a slot in a memory table.
     * @param operation The operation to execute.
     * @returns The result of the operation.
     */
    private executeMemorySlotOperation(operation: MemoryTableOperation) {
        const memorySlot = this.memoryTable[operation]
        switch (operation) {
            case "privateKey":
                this.cache.writeUint8Array(this.randomBytesPool.pool, memorySlot.start, memorySlot.length)
                this.randomBytesPool.increment(memorySlot.length)
                break
            case "publicKey":
                return
            case "sha256":
                return
            case "ripemd160":
                return
            case "networkByte":
                return
            case "checksum":
                return
            case "doubleSha256":
                return
            case "address":
                return
            case "witnessVersion":
                return
            case "squashed":
                return
            case "keccak256":
                return
            default:
                throw new Error(
                    cyGeneral.errors.stringifyError(KernelErrors.UNSUPPORTED_MEMORY_TABLE_OPERATION, undefined, {
                        operation,
                    })
                )
        }
    }
}
