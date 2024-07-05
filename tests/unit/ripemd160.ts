import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { test } from "@japa/runner"

test.group("ripemd160 / execute", (group) => {
    let ripemd160Algorithm: Ripemd160Algorithm
    let cache: Cache

    const hexInput = "CC32441A8B9ADE1B88AD5EC47787906BD6975636"
    const hexOutput = "87B4840D5999D40C8B2267B4F7800DC1644DBF73"

    group.each.setup(() => {
        cache = new Cache(40)
        cache.writeHexString(hexInput)

        ripemd160Algorithm = new Ripemd160Algorithm()
    })

    test("It should execute the SHA-256 algorithm (twice to ensure no data persistence)", ({ expect }) => {
        const inputSlot = { start: 0, length: 20, end: 20 }
        const outputSlot = { start: 20, length: 20, end: 40 }

        ripemd160Algorithm.execute(cache, inputSlot, outputSlot)
        ripemd160Algorithm.execute(cache, inputSlot, outputSlot)

        const result = cache.copy(outputSlot.start, 20).toHexString()
        expect(result).toBe(hexOutput)
    })
})
