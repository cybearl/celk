// import AddressGenerator from "#kernel/generators/address_generator"
// import Bench from "#lib/utils/benchmark"

import PrivateKeyGenerator from "#kernel/generators/private_key_generator"
import { MemorySlot } from "#kernel/utils/instructions"

// const addressGenerator = new AddressGenerator("BTC_BASE58_UNCOMPRESSED", {
//     enableDebugging: false,
// })

// const bench = new Bench(1024)

// bench.benchmark(() => addressGenerator.executeInstructions(), "generate()")
// bench.print("address_generator")

const lowerBound = 257n
const upperBound = 0xc174eeeccbaeb8f5cd775be3f071f00056ffcf5f145151a859ba5c1b3899e485n

const privateKeyGenerator = new PrivateKeyGenerator({
    privateKeySize: 32,
    lowerBound: lowerBound,
    upperBound: upperBound,
    poolSize: 32,
})

let privateKeySlot: MemorySlot
let privateKey: bigint

for (let i = 0; i < 10000000; i++) {
    privateKeySlot = privateKeyGenerator.generate()
    privateKey = privateKeyGenerator.pool.readBigInt(privateKeySlot.start, privateKeySlot.length)

    if (privateKey < lowerBound || privateKey > upperBound) {
        console.log(privateKey.toString())
        break
    }
}
