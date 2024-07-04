import Cache from "#kernel/cache"
import Bech32Encoder from "#kernel/encoders/bech32"

const inputHex = "90d4b011f894842c5866bad60883f9c457d80815"
const inputHexCache = Cache.fromHexString(inputHex)

const bech32Encoder = new Bech32Encoder()
const testEncode = bech32Encoder.encode("bc", inputHexCache)

console.log(testEncode)

// 0x1863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262
// 0x1863143C14C5166804BD19203356DA136C985678CD4D27A1B8C6329604903262F0
