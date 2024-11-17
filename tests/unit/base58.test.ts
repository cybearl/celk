import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import Base58Encoder from "#kernel/encoders/base58"

test.group("base58 / encode", (group) => {
    let base58Encoder: Base58Encoder

    const inputUtf8 = "128739950dcdd98e5"
    const outputUtf8 = "TpBuBsVUHAX3VdVWk8Z2BzU"

    const inputAddress = "00B33370C37DD76D5723354122B8AC7F58D95450D154AF8401"
    const outputAddress = "1HLXaV8k8JsT9gAzKJm4zKau5PcYSqpkpQ"

    group.each.setup(() => {
        base58Encoder = new Base58Encoder()
    })

    test("It should encode data from a cache into a base58 string", ({ expect }) => {
        const cache = Cache.fromUtf8String(inputUtf8)
        const result = base58Encoder.encode(cache)
        expect(result).toBe(outputUtf8)
    })

    test("It should encode an hexadecimal address into a base58 string", ({ expect }) => {
        const cache = Cache.fromHexString(inputAddress)
        const result = base58Encoder.encode(cache)
        expect(result).toBe(outputAddress)
    })
})

test.group("base58 / decode", (group) => {
    let base58Encoder: Base58Encoder

    const inputUtf8 = "128739950dcdd98e5"
    const outputUtf8 = "TpBuBsVUHAX3VdVWk8Z2BzU"

    const inputAddress = "00B33370C37DD76D5723354122B8AC7F58D95450D154AF8401"
    const outputAddress = "1HLXaV8k8JsT9gAzKJm4zKau5PcYSqpkpQ"

    group.each.setup(() => {
        base58Encoder = new Base58Encoder()
    })

    test("It should decode a base58 string and write it into a cache", ({ expect }) => {
        const cache = new Cache(outputUtf8.length)
        base58Encoder.decode(outputUtf8, cache)
        expect(cache.toUtf8String().slice(0, inputUtf8.length)).toStrictEqual(inputUtf8)
    })

    test("It should decode a base58 address and write it into a cache", ({ expect }) => {
        const cache = new Cache(inputAddress.length / 2)
        base58Encoder.decode(outputAddress, cache)
        expect(cache.toHexString()).toBe(inputAddress)
    })
})
