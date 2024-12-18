import Secp256k1Algorithm, { N_BIGINT } from "#kernel/algorithms/secp256k1"
import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"

const secp256k1Algorithm = new Secp256k1Algorithm()

const cache = new Cache(65)
const inputSlot: MemorySlot = { start: 0, length: 32, end: 32 }
const outputSlot: MemorySlot = { start: 32, length: 33, end: 65 }

cache.writeBigInt(N_BIGINT, inputSlot.start, inputSlot.length, "BE")
secp256k1Algorithm.generate("compressed", { cache, ...inputSlot }, { cache, ...outputSlot })

console.log(cache.readHexString(inputSlot.start, inputSlot.length))
console.log(cache.readHexString(outputSlot.start, outputSlot.length))
