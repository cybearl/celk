// import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import Sha256Algorithm from "#kernel/algorithms/sha256"
// import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"

const input =
    "04e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

const cache = new Cache(97)
const inputSlot: MemorySlot = { start: 0, length: 65, end: 65 }
const outputSlot: MemorySlot = { start: 65, length: 32, end: 97 }

cache.writeHexString(input, inputSlot.start)
console.log(input.toUpperCase())

// cache.writeHexString(input, inputSlot.start)

const sha256 = new Sha256Algorithm()

sha256.hash(cache, inputSlot, outputSlot)
// console.log(cache.readHexString(inputSlot.start, inputSlot.length))
// console.log(cache.readHexString(outputSlot.start, outputSlot.length))

sha256.hash(cache, inputSlot, outputSlot)

// sha256.hash(cache, inputSlot, outputSlot)
// console.log(cache.readHexString(outputSlot.start, outputSlot.length))

// const input = "38bbc57e4cbe8b6a1d2c999ef62503e0a6e58109"

// const cache = new Cache(40)
// const inputSlot: MemorySlot = { start: 0, length: 20, end: 20 }
// const outputSlot: MemorySlot = { start: 20, length: 20, end: 40 }

// cache.writeHexString(input, inputSlot.start)

// const ripemd160 = new Ripemd160Algorithm()

// ripemd160.hash(cache, inputSlot, outputSlot)

// console.log(cache.readHexString(outputSlot.start, outputSlot.length))
