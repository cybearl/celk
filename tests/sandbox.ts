import Secp256k1Algorithm from "#kernel/algorithms/secp256k1"
import Cache from "#kernel/utils/cache"
import { MemorySlot, MemorySlotWithCI } from "#kernel/utils/instructions"

const secp256k1Algorithm = new Secp256k1Algorithm()

const cache = new Cache(512)
const inputSlot: MemorySlotWithCI = { cache: cache, start: 0, length: 32, end: 32 }
const outputSlot: MemorySlotWithCI = { cache: cache, start: 32, length: 33, end: 65 }

const testValue = "6F737C2D39B4497F4A2556012F0C20E66608CB5D307555D646CE633425E38436"
cache.writeHexString(testValue, inputSlot.start)
secp256k1Algorithm.generate("compressed", inputSlot, outputSlot)

console.log("P:", cache.readHexString(inputSlot.start, inputSlot.length))
console.log("R:", "0356769717DC0F96890CC4E78D4408865B1C3A95AA50E238D2DB7259BBF19A0854")
console.log("V:", cache.readHexString(outputSlot.start, outputSlot.length))
