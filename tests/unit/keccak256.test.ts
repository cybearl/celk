import Cache from "#kernel/cache"
import { test } from "@japa/runner"
import Keccak256Algorithm from "#kernel/algorithms/keccak256"

test.group("keccak256 / hash", (group) => {
    let cache: Cache

    const input = "1CF8EEBF67DF4CC8DE3BC92242C7A5691A7CDD7EFE364B62C1B97063ED450B75"
    const output = "5608CA83F9A41A423FA54D5A12C1DD1212E5C699B157BFBDDBCB16EE12C07DCE"

    group.each.setup(() => {
        cache = new Cache(64)
    })

    test("It should hash the input and write the result into the output slot", ({ expect }) => {
        const inputSlot = { start: 0, length: 32, end: 32 }
        const outputSlot = { start: 32, length: 32, end: 64 }

        cache.writeHexString(input, inputSlot.start)
        Keccak256Algorithm.hash(cache, inputSlot, outputSlot)

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(output)
    })
})
