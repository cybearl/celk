import Cache from "#kernel/cache"
import Bech32Encoder from "#kernel/encoders/bech32"

const encoder = new Bech32Encoder()

const input = "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3"
const data = encoder.decodeToBytes(input)
const test = Cache.fromUint8Array(data)

console.log(test.toHexString())
console.log("0c318a1e0a628b34025e8c919ab6d09b64c2b3c66a693ddc63194b024819310")
