import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / general / check", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(10)
    })

    test("It should throw if the offset is an invalid number", ({ expect }) => {
        expect(() => cache.check(Number.NaN, 0)).toThrow()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        expect(() => cache.check("Z", 0)).toThrow()
    })

    test("It should throw if the length is an invalid number", ({ expect }) => {
        expect(() => cache.check(0, Number.NaN)).toThrow()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        expect(() => cache.check(0, "Z")).toThrow()
    })

    test("It should throw if the offset is negative", ({ expect }) => {
        expect(() => cache.check(-1, 0)).toThrow()
    })

    test("It should throw if the length is negative", ({ expect }) => {
        expect(() => cache.check(0, -1)).toThrow()
    })

    test("It should throw if the offset is out of bounds", ({ expect }) => {
        expect(() => cache.check(10, 0)).toThrow()
    })

    test("It should throw if the length is out of bounds", ({ expect }) => {
        expect(() => cache.check(0, 11)).toThrow()
    })

    test("It should throw if the offset + length is out of bounds", ({ expect }) => {
        expect(() => cache.check(9, 2)).toThrow()
    })

    test("It should throw if the offset modulo 1 is not 0", ({ expect }) => {
        expect(() => cache.check(0.5, 0)).toThrow()
    })

    test("It should throw if the length modulo 1 is not 0", ({ expect }) => {
        expect(() => cache.check(0, 0.5)).toThrow()
    })

    test("It should not throw if the offset is valid", ({ expect }) => {
        expect(() => cache.check(0, 10)).not.toThrow()
    })
})
