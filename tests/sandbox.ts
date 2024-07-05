import Sha256Algorithm from "#kernel/algorithms/sha256"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"

const testInput = "dd6d953fb934989bdbe64be4ba4fe4ed4e8275ce399ab72ded842316edb012ec"

const testCache = new Cache(64)

testCache.writeHexString(testInput)

const inputSlot: MemorySlot = { start: 0, length: 32, end: 32 }
const outputSlot: MemorySlot = { start: 32, length: 32, end: 64 }

const sha256 = new Sha256Algorithm()

sha256.execute(testCache, inputSlot, outputSlot)

const res = testCache.copy(outputSlot.start, 32).toHexString()

console.log(
    res === "1488eebf20c21b639e7d6e6468fa3f263cb8b7bcc11e167687c8120331bdf59b".toUpperCase()
        ? "Test passed"
        : "Test failed"
)
