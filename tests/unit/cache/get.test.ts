import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / get", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(10)
    })

    test("It should return the ArrayBuffer instance of the cache", ({ expect }) => {
        expect(cache.buffer).toBeInstanceOf(ArrayBuffer)
    })

    test("It should return the proper initial byteOffset of the cache", ({ expect }) => {
        expect(cache.byteOffset).toBe(0)
    })

    test("It should return the proper initial offset of the cache", ({ expect }) => {
        expect(cache.offset).toBe(0)
    })

    test("It should return the proper cache length (byteLength)", ({ expect }) => {
        expect(cache.byteLength).toBe(10)
    })

    test("It should return the proper cache length (length)", ({ expect }) => {
        expect(cache.length).toBe(10)
    })
})
