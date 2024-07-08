// import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import Sha256Algorithm from "#kernel/algorithms/sha256"
import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"

// const input = "1a03c02fb531d7e1ce353b2f20711c79af2b66730d6de865fb130734973ccd2c"

// const cache = new Cache(64)
// const inputSlot: MemorySlot = { start: 0, length: 32, end: 32 }
// const outputSlot: MemorySlot = { start: 32, length: 32, end: 64 }

// cache.writeHexString(input, inputSlot.start)

// const sha256 = new Sha256Algorithm()

// sha256.hash(cache, inputSlot, outputSlot)
// console.log(cache.readHexString(outputSlot.start, outputSlot.length))

// sha256.hash(cache, inputSlot, outputSlot)
// console.log(cache.readHexString(outputSlot.start, outputSlot.length))

const input = "38bbc57e4cbe8b6a1d2c999ef62503e0a6e58109"

const cache = new Cache(40)
const inputSlot: MemorySlot = { start: 0, length: 20, end: 20 }
const outputSlot: MemorySlot = { start: 20, length: 20, end: 40 }

cache.writeHexString(input, inputSlot.start)

const ripemd160 = new Ripemd160Algorithm()

ripemd160.hash(cache, inputSlot, outputSlot)

console.log(cache.readHexString(outputSlot.start, outputSlot.length))
