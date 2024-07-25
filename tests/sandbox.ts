// import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import Sha256Algorithm from "#kernel/algorithms/sha256"
import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
// import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"

const input =
    "04e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

const cache = new Cache(97)
const inputSlot: MemorySlot = { start: 0, length: 65, end: 65 }
const outputSlot: MemorySlot = { start: 65, length: 32, end: 97 }

cache.writeHexString(input, inputSlot.start)
console.log("INP:", input.toUpperCase())

const sha256 = new Sha256Algorithm()

sha256.hash(cache, inputSlot, outputSlot)
console.log(cache.readHexString(outputSlot.start, outputSlot.length))

sha256.hash(cache, inputSlot, outputSlot)
console.log(cache.readHexString(outputSlot.start, outputSlot.length))

// const ripemd160 = new Ripemd160Algorithm()

// ripemd160.hash(cache, inputSlot, outputSlot)
// console.log("RES:", cache.readHexString(outputSlot.start, outputSlot.length))

// ripemd160.hash(cache, inputSlot, outputSlot)
// console.log("RES:", cache.readHexString(outputSlot.start, outputSlot.length))
