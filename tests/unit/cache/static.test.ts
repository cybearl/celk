import Cache, { Bit } from "#kernel/utils/cache"
import { test } from "@japa/runner"
import os from "node:os"

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

test.group("cache / static / fromUint16Array", (group) => {
    let cache: Cache

    const uint16Array = new Uint16Array([0xff11, 0x11ff])
    const uint16ArrayByteValuesLE = [0x11, 0xff, 0xff, 0x11]
    const uint16ArrayByteValuesBE = [0xff, 0x11, 0x11, 0xff]

    group.each.setup(() => {
        cache = Cache.fromUint16Array(uint16Array)
    })

    test("It should create a cache from a Uint16Array", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        expect(cache.length).toBe(uint16Array.length * 2)
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            if (os.endianness() === "LE") {
                expect(cache.readUint8(i)).toBe(uint16ArrayByteValuesLE[i])
            } else {
                expect(cache.readUint8(i)).toBe(uint16ArrayByteValuesBE[i])
            }
        }
    })
})

test.group("cache / static / fromUint32Array", (group) => {
    let cache: Cache

    const uint32Array = new Uint32Array([0xff11ff11, 0x11ff11ff])
    const uint32ArrayByteValuesLE = [0x11, 0xff, 0x11, 0xff, 0xff, 0x11, 0xff, 0x11]
    const uint32ArrayByteValuesBE = [0xff, 0x11, 0xff, 0x11, 0x11, 0xff, 0x11, 0xff]

    group.each.setup(() => {
        cache = Cache.fromUint32Array(uint32Array)
    })

    test("It should create a cache from a Uint32Array", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        expect(cache.length).toBe(uint32Array.length * 4)
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            if (os.endianness() === "LE") {
                expect(cache.readUint8(i)).toBe(uint32ArrayByteValuesLE[i])
            } else {
                expect(cache.readUint8(i)).toBe(uint32ArrayByteValuesBE[i])
            }
        }
    })
})

test.group("cache / static / fromBigInt", (group) => {
    let cache: Cache

    const bigInt = BigInt(0xff11ff11ff11)
    const bigIntByteValues = [0x11, 0xff, 0x11, 0xff, 0x11, 0xff, 0x00, 0x00]

    group.each.setup(() => {
        cache = Cache.fromBigInt(bigInt)
    })

    test("It should create a cache from a BigInt", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        expect(cache.length).toBe(Math.ceil(bigInt.toString(16).length / 2))
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(bigIntByteValues[i])
        }
    })
})

test.group("cache / static / fromRange", (group) => {
    let cache: Cache

    const start = 0
    const end = 10
    const rangeByteValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

    group.each.setup(() => {
        cache = Cache.fromRange(start, end)
    })

    test("It should create a cache from a range", ({ expect }) => {
        expect(cache).toBeInstanceOf(Cache)
    })

    test("It should create a cache with the correct length", ({ expect }) => {
        expect(cache.length).toBe(end - start)
    })

    test("It should create a cache with the correct values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(rangeByteValues[i])
        }
    })
})
