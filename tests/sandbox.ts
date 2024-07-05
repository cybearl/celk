import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"

const testInput = "cc32441a8b9ade1b88ad5ec47787906bd6975636"

const testCache = new Cache(40)

testCache.writeHexString(testInput)

const inputSlot: MemorySlot = { start: 0, length: 20, end: 20 }
const outputSlot: MemorySlot = { start: 20, length: 20, end: 40 }

const ripemd160 = new Ripemd160Algorithm()

ripemd160.execute(testCache, inputSlot, outputSlot)

const res = testCache.copy(outputSlot.start, 20).toHexString()

console.log(res)

console.log(res === "87b4840d5999d40c8b2267b4f7800dc1644dbf73".toUpperCase() ? "Test passed" : "Test failed")
