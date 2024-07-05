import Cache from "#kernel/cache"
import Bech32Encoder from "#kernel/encoders/bech32"

const inputHex = "751e76e8199196d454941c45d1b3a323f1433bd6".toUpperCase()
const inputHexCache = Cache.fromHexString(inputHex)
const outputCache = new Cache(inputHex.length / 2)

const bech32Encoder = new Bech32Encoder()
const testEncode = bech32Encoder.encode("bc", 0, inputHexCache)
bech32Encoder.decode(testEncode, outputCache)

console.log("  INPUT:", inputHex)
console.log("ENCODED:", testEncode)
console.log("DECODED:", outputCache.toHexString())
