import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / convert / toHexString", (group) => {
    let cache: Cache

    const hexString = "FF00FF00"

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    test("It should convert the cache to a hex string", ({ expect }) => {
        expect(cache.toHexString()).toBe(hexString)
    })

    test("It should convert the cache to a hex string with the '0x' prefix", ({ expect }) => {
        expect(cache.toHexString(true)).toBe(`0x${hexString}`)
    })
})

test.group("cache / convert / toUtf8String", (group) => {
    let cache: Cache

    const utf8String = "Hello, world!"

    group.each.setup(() => {
        cache = Cache.fromUtf8String(utf8String)
    })

    test("It should convert the cache to a UTF-8 string", ({ expect }) => {
        expect(cache.toUtf8String()).toBe(utf8String)
    })
})

test.group("cache / convert / toString", (group) => {
    let cache: Cache

    const hexString = "FF00FF00"

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    const utf8String = "Hello, world!"

    test("It should convert the cache to an hexadecimal string", ({ expect }) => {
        expect(cache.toString()).toBe(hexString)
    })

    test("It should convert the cache to a an hexadecimal string with the '0x' prefix", ({ expect }) => {
        expect(cache.toString("hex", true)).toBe(`0x${hexString}`)
    })

    test("It should convert the cache to a UTF-8 string", ({ expect }) => {
        cache = Cache.fromUtf8String(utf8String)
        expect(cache.toString("utf8")).toBe(utf8String)
    })
})

test.group("cache / convert / toBits", (group) => {
    let cache: Cache

    const hexString = "FF00"

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    const bits = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]

    test("It should convert the cache to an array of bits", ({ expect }) => {
        expect(cache.toBits()).toEqual(bits)
    })
})

test.group("cache / convert / toUint8Array", (group) => {
    let cache: Cache

    const hexString = "FF11FF11"

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    const uint8Array = new Uint8Array([0xff, 0x11, 0xff, 0x11])

    test("It should convert the cache to a Uint8Array", ({ expect }) => {
        expect(cache.toUint8Array()).toEqual(uint8Array)
    })
})

test.group("cache / convert / toUint16Array", (group) => {
    let cache: Cache

    const hexString = "1F1F1F1F"

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    const uint16Array = new Uint16Array([0x1f1f, 0x1f1f])

    test("It should convert the cache to a Uint16Array", ({ expect }) => {
        expect(cache.toUint16Array()).toEqual(uint16Array)
    })
})

test.group("cache / convert / toUint32Array", (group) => {
    let cache: Cache

    const hexString = "1F1F1F1F1F1F1F1F"

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    const uint32Array = new Uint32Array([0x1f1f1f1f, 0x1f1f1f1f])

    test("It should convert the cache to a Uint32Array", ({ expect }) => {
        expect(cache.toUint32Array()).toEqual(uint32Array)
    })
})
