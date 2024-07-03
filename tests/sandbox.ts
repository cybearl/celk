import Bech32Encoder from "#kernel/encoders/bech32"

const encoder = new Bech32Encoder(true)

// const test1 = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
const test2 = "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3"

// const data1 = encoder.decodeToBytes(test1)
const data2 = encoder.decodeToBytes(test2)

// console.log(data1)
console.log(data2)
