import Cache from "#kernel/cache"
import { test } from "@japa/runner"
import Sha256Algorithm from "#kernel/algorithms/sha256"

test.group("sha256 / hash", (group) => {
    let sha256Algorithm: Sha256Algorithm
    let cache: Cache

    const input = "1CF8EEBF67DF4CC8DE3BC92242C7A5691A7CDD7EFE364B62C1B97063ED450B75"
    const output = "898CFEDB90F07D4A791FC01A952D5147DEEA2548E63BD06269CC1C56F6C3EEA1"

    group.each.setup(() => {
        sha256Algorithm = new Sha256Algorithm()
        cache = new Cache(64)
    })

    test("It should hash the input and write the result into the output slot", ({ expect }) => {
        const inputSlot = { start: 0, length: 32, end: 32 }
        const outputSlot = { start: 32, length: 32, end: 64 }

        cache.writeHexString(input, inputSlot.start)
        sha256Algorithm.hash(cache, inputSlot, outputSlot)

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(output)
    })

    test("It should hash the same input twice and write the same result when using a single cache", ({ expect }) => {
        const inputSlot = { start: 0, length: 32, end: 32 }
        const outputSlot = { start: 32, length: 32, end: 64 }

        cache.writeHexString(input, inputSlot.start)

        sha256Algorithm.hash(cache, inputSlot, outputSlot)
        const firstHash = cache.readHexString(outputSlot.start, outputSlot.length)

        sha256Algorithm.hash(cache, inputSlot, outputSlot)
        const secondHash = cache.readHexString(outputSlot.start, outputSlot.length)

        expect(firstHash).toBe(output)
        expect(secondHash).toBe(output)
    })

    test("It should hash the same input twice and write the same result when using different caches", ({ expect }) => {
        const inputSlot = { start: 0, length: 32, end: 32 }
        const outputSlot = { start: 32, length: 32, end: 64 }

        const cache1 = new Cache(64)
        const cache2 = new Cache(64)

        cache1.writeHexString(input, inputSlot.start)
        cache2.writeHexString(input, inputSlot.start)

        sha256Algorithm.hash(cache1, inputSlot, outputSlot)
        const firstHash = cache1.readHexString(outputSlot.start, outputSlot.length)

        sha256Algorithm.hash(cache2, inputSlot, outputSlot)
        const secondHash = cache2.readHexString(outputSlot.start, outputSlot.length)

        expect(firstHash).toBe(output)
        expect(secondHash).toBe(output)
    })

    test("It should properly hash the same non-aligned input twice (length % 4 != 0)", ({ expect }) => {
        const testInput =
            "04E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855"

        const inputSlot = { start: 0, length: 31, end: 31 }
        const outputSlot = { start: 31, length: 32, end: 63 }

        cache.writeHexString(testInput, inputSlot.start)

        sha256Algorithm.hash(cache, inputSlot, outputSlot)
        const firstHash = cache.readHexString(outputSlot.start, outputSlot.length)

        sha256Algorithm.hash(cache, inputSlot, outputSlot)
        const secondHash = cache.readHexString(outputSlot.start, outputSlot.length)

        expect(firstHash).toBe(output)
        expect(secondHash).toBe(output)
    })
})
