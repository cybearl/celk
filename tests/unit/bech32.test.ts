import Cache from "#kernel/cache"
import { test } from "@japa/runner"
import Bech32Encoder from "#kernel/encoders/bech32"

test.group("bech32 / encode", (group) => {
    let bech32Encoder: Bech32Encoder

    const inputHex = "128739950dcdd98e5c01a056a19a3b2a9c77b9b7"
    const output = "bc1qz2rnn9gdehvcuhqp5pt2rx3m92w80wdhzp9xlg"

    group.each.setup(() => {
        bech32Encoder = new Bech32Encoder()
    })

    test("It should encode data from a cache into a bech32 string", ({ expect }) => {
        const cache = Cache.fromHexString(inputHex)
        const result = bech32Encoder.encode(0, "bc", cache)
        expect(result).toBe(output)
    })
})

test.group("bech32 / decode", (group) => {
    let bech32Encoder: Bech32Encoder

    const inputHex = "128739950dcdd98e5c01a056a19a3b2a9c77b9b7"
    const output = "bc1qz2rnn9gdehvcuhqp5pt2rx3m92w80wdhzp9xlg"

    group.each.setup(() => {
        bech32Encoder = new Bech32Encoder()
    })

    test("It should decode a bech32 string and write it into a cache", ({ expect }) => {
        const cache = new Cache(inputHex.length / 2)
        bech32Encoder.decode(output, cache)
        expect(cache.toHexString()).toBe(inputHex.toUpperCase())
    })
})

test.group("bech32m / encode", (group) => {
    let bech32Encoder: Bech32Encoder

    const inputHex = "128739950dcdd98e5c01a056a19a3b2a9c77b9b7"
    const output = "bc1gz2rnn9gdehvcuhqp5pt2rx3m92w80wdhamfqfq"

    group.each.setup(() => {
        bech32Encoder = new Bech32Encoder()
    })

    test("It should encode a cache to a bech32m string", ({ expect }) => {
        const cache = Cache.fromHexString(inputHex)
        const result = bech32Encoder.encode(8, "bc", cache)
        expect(result).toBe(output)
    })
})

test.group("bech32m / decode", (group) => {
    let bech32Encoder: Bech32Encoder

    const inputHex = "128739950dcdd98e5c01a056a19a3b2a9c77b9b7"
    const output = "bc1qz2rnn9gdehvcuhqp5pt2rx3m92w80wdhzp9xlg"

    group.each.setup(() => {
        bech32Encoder = new Bech32Encoder()
    })

    test("It should decode a bech32m string to a cache", ({ expect }) => {
        const cache = new Cache(inputHex.length / 2)
        bech32Encoder.decode(output, cache)
        expect(cache.toHexString()).toBe(inputHex.toUpperCase())
    })
})
