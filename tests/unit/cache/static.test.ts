import Cache, { Bit } from "#kernel/cache"
import { test } from "@japa/runner"

test.group("cache / static / alloc", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = Cache.alloc(10)
    })

    test("It should allocate a cache", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should allocate a cache with the specified length", ({ expect }) => {
        expect(cache.length).toBe(10)
    })

    test("It should use a SharedArrayBuffer by default", ({ expect }) => {
        expect(cache.buffer).toBeInstanceOf(SharedArrayBuffer)
    })

    test("It should use an ArrayBuffer if specified", ({ expect }) => {
        cache = Cache.alloc(10, false)
        expect(cache.buffer).toBeInstanceOf(ArrayBuffer)
    })
})

test.group("cache / static / fromHexString", (group) => {
    let cache: Cache

    const hexString = "FF00FF00"
    const hexStringByteValues = [0xff, 0x00, 0xff, 0x00]

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    test("It should create a cache from a hex string", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        expect(cache.length).toBe(Math.ceil(hexString.length / 2))
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(hexStringByteValues[i])
        }
    })
})

test.group("cache / static / fromUtf8String", () => {
    const utf8String = "Hello, world!"
    const utf8StringByteValues = [0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]

    test("It should create a cache from a UTF-8 string", ({ expect }) => {
        const cache = Cache.fromUtf8String(utf8String)
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        const cache = Cache.fromUtf8String(utf8String)
        expect(cache.length).toBe(utf8String.length)
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        const cache = Cache.fromUtf8String(utf8String)

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(utf8StringByteValues[i])
        }
    })
})

test.group("cache / static / fromBits", (group) => {
    let cache: Cache

    const bits: Bit[] = [0, 1, 0, 1, 1, 0, 1, 0]
    const bitsByteValues = [0b01011010]

    group.each.setup(() => {
        cache = Cache.fromBits(bits)
    })

    test("It should create a cache from an array of bits", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        expect(cache.length).toBe(Math.ceil(bits.length / 8))
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(bitsByteValues[i])
        }
    })
})

test.group("cache / static / fromUint8Array", (group) => {
    let cache: Cache

    const uint8Array = new Uint8Array([0xff, 0x11, 0xff, 0x11])

    group.each.setup(() => {
        cache = Cache.fromUint8Array(uint8Array)
    })

    test("It should create a cache from a Uint8Array", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        expect(cache.length).toBe(uint8Array.length)
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint8Array[i])
        }
    })
})
