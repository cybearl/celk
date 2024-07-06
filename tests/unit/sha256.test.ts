import Cache from "#kernel/cache"
import { test } from "@japa/runner"
import Sha256Algorithm from "#kernel/algorithms/sha256"

test.group("sha256 / hash", (group) => {
    let cache: Cache

    const input = "1CF8EEBF67DF4CC8DE3BC92242C7A5691A7CDD7EFE364B62C1B97063ED450B75"
    const output = "898CFEDB90F07D4A791FC01A952D5147DEEA2548E63BD06269CC1C56F6C3EEA1"

    group.each.setup(() => {
        cache = new Cache(64)
    })

    test("It should hash the input and write the result into the output slot", ({ expect }) => {
        const inputSlot = { start: 0, length: 32, end: 32 }
        const outputSlot = { start: 32, length: 32, end: 64 }

        cache.writeHexString(input, inputSlot.start)
        Sha256Algorithm.hash(cache, inputSlot, outputSlot)

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(output)
    })
})
