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
    privateKeySize: 3,
    lowerBound: 7,
    upperBound: 65536,
    poolSize: 3,
})

privateKeyGenerator.generate()
