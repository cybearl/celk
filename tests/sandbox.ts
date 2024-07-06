import Sha256Algorithm from "#kernel/algorithms/sha256"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"

const input = "75d7682c8b5955557b2ef33654f31512b9b3edd17f74b5bf422ccabbd7537e1a"

const cache = new Cache(64)
const inputSlot: MemorySlot = { start: 0, length: 32, end: 32 }
const outputSlot: MemorySlot = { start: 32, length: 32, end: 64 }

cache.writeHexString(input, inputSlot.start)

Sha256Algorithm.hash(cache, inputSlot, outputSlot)

console.log(cache.readHexString(outputSlot.start, outputSlot.length))
