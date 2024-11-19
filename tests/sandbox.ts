// import AddressGenerator from "#kernel/generators/address_generator"
// import Bench from "#lib/utils/benchmark"

import PrivateKeyGenerator from "#kernel/generators/private_key_generator"

// const addressGenerator = new AddressGenerator("BTC_BASE58_UNCOMPRESSED", {
//     enableDebugging: false,
// })

// const bench = new Bench(1024)

// bench.benchmark(() => addressGenerator.executeInstructions(), "generate()")
// bench.print("address_generator")

const privateKeyGenerator = new PrivateKeyGenerator({
    privateKeySize: 2,
    lowerBound: 0n,
    upperBound: 256n,
    poolSize: 2,
})

privateKeyGenerator.generate()
const privateKeySlot = privateKeyGenerator.generate()
const privateKey = privateKeyGenerator.pool.readBigInt(privateKeySlot.start, privateKeySlot.length)
console.log(privateKey.toString(16), privateKey.toString(10))
