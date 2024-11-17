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
    lowerBound: 0,
    upperBound: 255,
    poolSize: 16,
})

// const privateKey = privateKeyGenerator.generate()
