import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / iterate / symbol", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(10)
    })

    test("it should iterate over the cache", ({ expect }) => {
        const cacheValues = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]

        for (let i = 0; i < cache.length; i++) {
            cache.writeUint8(i, i)
        }

        let i = 0
        for (const value of cache) {
            expect(value).toBe(cacheValues[i])
            i++
        }
    })
})

test.group("cache / iterate / entries", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(10)
    })

    test("It should iterate over the cache entries", ({ expect }) => {
        const cacheEntries = [
            [0, 0x00],
            [1, 0x01],
            [2, 0x02],
            [3, 0x03],
            [4, 0x04],
            [5, 0x05],
            [6, 0x06],
            [7, 0x07],
            [8, 0x08],
            [9, 0x09],
        ]

        for (let i = 0; i < cache.length; i++) {
            cache.writeUint8(i, i)
        }

        let i = 0
        for (const entry of cache.entries()) {
            expect(entry).toEqual(cacheEntries[i])
            i++
        }
    })
})
