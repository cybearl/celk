import Cache from "#kernel/cache"
import { test } from "@japa/runner"
import Base58Encoder from "#kernel/encoders/base58"

test.group("base58 / encode", (group) => {
    let base58Encoder: Base58Encoder

    const inputUtf8 = "128739950dcdd98e5"
    const output = "TpBuBsVUHAX3VdVWk8Z2BzU"

    group.each.setup(() => {
        base58Encoder = new Base58Encoder()
    })

    test("It should encode data from a cache into a base58 string", ({ expect }) => {
        const cache = Cache.fromUtf8String(inputUtf8)
        const result = base58Encoder.encode(cache)
        expect(result).toBe(output)
    })
})

test.group("base58 / decode", (group) => {
    let base58Encoder: Base58Encoder

    const input = "TpBuBsVUHAX3VdVWk8Z2BzU"
    const outputUtf8 = "128739950dcdd98e5"

    group.each.setup(() => {
        base58Encoder = new Base58Encoder()
    })

    test("It should decode a base58 string and write it into a cache", ({ expect }) => {
        const cache = new Cache(outputUtf8.length)
        base58Encoder.decode(input, cache)
        expect(cache.toUtf8String()).toBe(outputUtf8)
    })
})
