import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / check / equals", (group) => {
    let cache1: Cache
    let cache2: Cache
    let cache3: Cache

    group.each.setup(() => {
        cache1 = Cache.fromHexString("FF11FF11")
        cache2 = Cache.fromHexString("FF11FF11")
        cache3 = Cache.fromHexString("FF11FF")
    })

    test("It should return true if the caches are equal", ({ expect }) => {
        expect(cache1.equals(cache2)).toBe(true)
    })

    test("It should return false if the caches are not equal", ({ expect }) => {
        cache2.writeUint8(0, 0x00)
        expect(cache1.equals(cache2)).toBe(false)
    })

    test("It should return false if the caches have different lengths", ({ expect }) => {
        expect(cache1.equals(cache3)).toBe(false)
    })
})

test.group("cache / check / isEmpty", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = Cache.alloc(4)
    })

    test("It should return true if the cache is empty", ({ expect }) => {
        expect(cache.isEmpty()).toBe(true)
    })

    test("It should return false if the cache is not empty", ({ expect }) => {
        cache.writeUint8(0xff)
        expect(cache.isEmpty()).toBe(false)
    })
})
