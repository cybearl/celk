import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / random / randomFill", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = Cache.alloc(10)
    })

    test("It should fill the cache with random values", ({ expect }) => {
        cache.randomFill()

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0)
            expect(cache.readUint8(i)).toBeLessThanOrEqual(0xff)
        }
    })

    test("It should fill the cache with random values at the specified offset", ({ expect }) => {
        cache.randomFill(5)

        for (let i = 0; i < cache.length; i++) {
            if (i < 5) {
                expect(cache.readUint8(i)).toBe(0x00)
            } else {
                expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0)
                expect(cache.readUint8(i)).toBeLessThanOrEqual(0xff)
            }
        }
    })
})

test.group("cache / random / safeRandomFill", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = Cache.alloc(10)
    })

    test("It should fill the cache with cryptographically secure random values", ({ expect }) => {
        cache.safeRandomFill()

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0)
            expect(cache.readUint8(i)).toBeLessThanOrEqual(0xff)
        }
    })

    test("It should fill the cache with cryptographically secure random values at the specified offset", ({
        expect,
    }) => {
        cache.safeRandomFill(5, 5)

        for (let i = 0; i < cache.length; i++) {
            if (i < 5) {
                expect(cache.readUint8(i)).toBe(0x00)
            } else {
                expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0)
                expect(cache.readUint8(i)).toBeLessThanOrEqual(0xff)
            }
        }
    })
})
