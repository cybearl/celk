import Ripemd256Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"

const input = "38bbc57e4cbe8b6a1d2c999ef62503e0a6e58109"

const cache = new Cache(40)
const inputSlot: MemorySlot = { start: 0, length: 20, end: 20 }
const outputSlot: MemorySlot = { start: 20, length: 20, end: 40 }

cache.writeHexString(input, inputSlot.start)

const ripemd160 = new Ripemd256Algorithm()

ripemd160.exec(cache, inputSlot, outputSlot)

console.log(cache.readHexString(outputSlot.start, outputSlot.length))
