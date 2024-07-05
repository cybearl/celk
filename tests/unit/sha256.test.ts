import Cache from "#kernel/cache"
import { test } from "@japa/runner"
import Sha256Algorithm from "#kernel/algorithms/sha256"

test.group("sha256 / execute", (group) => {
    let sha256Algorithm: Sha256Algorithm
    let cache: Cache

    const hexInput = "DD6D953FB934989BDBE64BE4BA4FE4ED4E8275CE399AB72DED842316EDB012EC"
    const hexOutput = "1488EEBF20C21B639E7D6E6468FA3F263CB8B7BCC11E167687C8120331BDF59B"

    group.each.setup(() => {
        cache = new Cache(64)
        cache.writeHexString(hexInput)

        sha256Algorithm = new Sha256Algorithm()
    })

    test("It should execute the SHA-256 algorithm (twice to ensure no data persistence)", ({ expect }) => {
        const inputSlot = { start: 0, length: 32, end: 32 }
        const outputSlot = { start: 32, length: 32, end: 64 }

        sha256Algorithm.execute(cache, inputSlot, outputSlot)
        sha256Algorithm.execute(cache, inputSlot, outputSlot)

        const result = cache.copy(outputSlot.start, 32).toHexString()
        expect(result).toBe(hexOutput)
    })
})
