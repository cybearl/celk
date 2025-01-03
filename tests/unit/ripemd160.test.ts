import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"

test.group("ripemd160 / hash", (group) => {
    let ripemd160Algorithm: Ripemd160Algorithm
    let cache: Cache

    const input = "9C1185A5C5E9FC54612808977EE8F548B2258D31"
    const output = "38BBC57E4CBE8B6A1D2C999EF62503E0A6E58109"

    group.each.setup(() => {
        ripemd160Algorithm = new Ripemd160Algorithm()
        cache = new Cache(128)
    })

    test("It should hash the input and write the result into the output slot", ({ expect }) => {
        const inputSlot = { start: 0, length: 20, end: 20 }
        const outputSlot = { start: 20, length: 20, end: 40 }

        cache.writeHexString(input, inputSlot.start)
        ripemd160Algorithm.hash({ cache, ...inputSlot }, { cache, ...outputSlot })

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(output)
    })

    test("It should hash the same input twice and write the same result when using a single cache", ({ expect }) => {
        const inputSlot = { start: 0, length: 20, end: 20 }
        const outputSlot = { start: 20, length: 20, end: 40 }

        cache.writeHexString(input, inputSlot.start)

        ripemd160Algorithm.hash({ cache, ...inputSlot }, { cache, ...outputSlot })
        const firstHash = cache.readHexString(outputSlot.start, outputSlot.length)

        ripemd160Algorithm.hash({ cache, ...inputSlot }, { cache, ...outputSlot })
        const secondHash = cache.readHexString(outputSlot.start, outputSlot.length)

        expect(firstHash).toBe(output)
        expect(secondHash).toBe(output)
    })

    test("It should hash the same input twice and write the same result when using different caches", ({ expect }) => {
        const inputSlot = { start: 0, length: 20, end: 20 }
        const outputSlot = { start: 20, length: 20, end: 40 }

        const cache1 = new Cache(40)
        const cache2 = new Cache(40)

        cache1.writeHexString(input, inputSlot.start)
        cache2.writeHexString(input, inputSlot.start)

        ripemd160Algorithm.hash({ cache: cache1, ...inputSlot }, { cache: cache1, ...outputSlot })
        const firstHash = cache1.readHexString(outputSlot.start, outputSlot.length)

        ripemd160Algorithm.hash({ cache: cache2, ...inputSlot }, { cache: cache2, ...outputSlot })
        const secondHash = cache2.readHexString(outputSlot.start, outputSlot.length)

        expect(firstHash).toBe(output)
        expect(secondHash).toBe(output)
    })

    test("It should properly hash the same non-aligned input twice (length % 4 != 0)", ({ expect }) => {
        const testInput =
            "04E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"
        const testOutput = "5D5ADDB6E9EDC062325B990C9DDECECAA901D50A"

        const inputSlot = { start: 0, length: 65, end: 65 }
        const outputSlot = { start: 65, length: 20, end: 85 }

        cache.writeHexString(testInput, inputSlot.start)

        ripemd160Algorithm.hash({ cache, ...inputSlot }, { cache, ...outputSlot })
        const firstHash = cache.readHexString(outputSlot.start, outputSlot.length)

        ripemd160Algorithm.hash({ cache, ...inputSlot }, { cache, ...outputSlot })
        const secondHash = cache.readHexString(outputSlot.start, outputSlot.length)

        expect(firstHash).toBe(testOutput)
        expect(secondHash).toBe(testOutput)
    })
})
