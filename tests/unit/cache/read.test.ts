import Cache, { Bit } from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / read / readHexString", (group) => {
    let cache: Cache

    const hexString = "FF21FF11"

    group.each.setup(() => {
        cache = Cache.fromHexString(hexString)
    })

    test("It should read a hex string from the cache", ({ expect }) => {
        expect(cache.readHexString()).toBe(hexString)
    })

    test("It should read a hex string from the cache at the specified offset", ({ expect }) => {
        expect(cache.readHexString(1, 3)).toBe("21FF11")
        expect(cache.readHexString(2, 2)).toBe("FF11")
        expect(cache.readHexString(3, 1)).toBe("11")
    })
})

test.group("cache / read / readUtf8String", (group) => {
    let cache: Cache

    const utf8String = "Hello, world!"

    group.each.setup(() => {
        cache = Cache.fromUtf8String(utf8String)
    })

    test("It should read a UTF-8 string from the cache", ({ expect }) => {
        expect(cache.readUtf8String()).toBe(utf8String)
    })

    test("It should read a UTF-8 string from the cache at the specified offset", ({ expect }) => {
        expect(cache.readUtf8String(1)).toBe("ello, world!")
        expect(cache.readUtf8String(2)).toBe("llo, world!")
        expect(cache.readUtf8String(3)).toBe("lo, world!")
    })
})

test.group("cache / read / readBit", (group) => {
    let cache: Cache

    const bits: Bit[] = [1, 0]

    group.each.setup(() => {
        cache = Cache.alloc(1)
        for (let i = 0; i < cache.length; i++) {
            cache.writeBit(bits[i], i)
        }
    })

    test("It should read a bit from the cache", ({ expect }) => {
        expect(cache.readBit(0)).toBe(bits[0])
    })

    test("It should read a bit from the cache at the specified offset", ({ expect }) => {
        expect(cache.readBit(1)).toBe(bits[1])
    })
})

test.group("cache / read / readUint8", (group) => {
    let cache: Cache

    const uint8s = [0xff, 0x1f]

    group.each.setup(() => {
        cache = Cache.alloc(2)
        for (let i = 0; i < cache.length; i++) {
            cache.writeUint8(uint8s[i], i)
        }
    })

    test("It should read a uint8 from the cache", ({ expect }) => {
        expect(cache.readUint8()).toBe(uint8s[0])
    })

    test("It should read a uint8 from the cache at the specified offset", ({ expect }) => {
        expect(cache.readUint8(1)).toBe(uint8s[1])
    })
})

test.group("cache / read / readUint16", (group) => {
    let cache: Cache

    const uint16sByteValues = [0xff, 0x11, 0x1f, 0x1f]
    const uint16sLE = [0x11ff, 0x1f1f]
    const uint16sBE = [0xff11, 0x1f1f]

    group.each.setup(() => {
        cache = Cache.alloc(4)
        for (let i = 0; i < cache.length; i++) {
            cache.writeUint8(uint16sByteValues[i], i)
        }
    })

    test("It should read a uint16 from the cache (little endian)", ({ expect }) => {
        expect(cache.readUint16(0, "LE")).toBe(uint16sLE[0])
    })

    test("It should read a uint16 from the cache (big endian)", ({ expect }) => {
        expect(cache.readUint16(0, "BE")).toBe(uint16sBE[0])
    })

    test("It should read a uint16 from the cache at the specified byte offset (little endian)", ({ expect }) => {
        expect(cache.readUint16(2, "LE")).toBe(uint16sLE[1])
    })

    test("It should read a uint16 from the cache at the specified byte offset (big endian)", ({ expect }) => {
        expect(cache.readUint16(2, "BE")).toBe(uint16sBE[1])
    })

    test("It should throw if the byte offset is not aligned to 2 bytes", ({ expect }) => {
        expect(() => cache.readUint16(1)).toThrow()
    })
})

test.group("cache / read / readUint32", (group) => {
    let cache: Cache

    const uint32sByteValues = [0xff, 0x22, 0xff, 0x11, 0x1f, 0x1f, 0x1f, 0x1f]
    const uint32sLE = [0x11ff22ff, 0x1f1f1f1f]
    const uint32sBE = [0xff22ff11, 0x1f1f1f1f]

    group.each.setup(() => {
        cache = Cache.alloc(8)
        for (let i = 0; i < cache.length; i++) {
            cache.writeUint8(uint32sByteValues[i], i)
        }
    })

    test("It should read a uint32 from the cache (little endian)", ({ expect }) => {
        expect(cache.readUint32(0, "LE")).toBe(uint32sLE[0])
    })

    test("It should read a uint32 from the cache (big endian)", ({ expect }) => {
        expect(cache.readUint32(0, "BE")).toBe(uint32sBE[0])
    })

    test("It should read a uint32 from the cache at the specified byte offset (little endian)", ({ expect }) => {
        expect(cache.readUint32(4, "LE")).toBe(uint32sLE[1])
    })

    test("It should read a uint32 from the cache at the specified byte offset (big endian)", ({ expect }) => {
        expect(cache.readUint32(4, "BE")).toBe(uint32sBE[1])
    })

    test("It should throw if the byte offset is not aligned to 4 bytes", ({ expect }) => {
        expect(() => cache.readUint32(2)).toThrow()
    })
})

test.group("cache / read / readBigInt", (group) => {
    let cache: Cache

    const bigIntByteValues = [0xff, 0x01, 0xff, 0x01, 0xff, 0x11, 0xff, 0x11]
    const bigIntsLE = [BigInt(0xff01ff01), BigInt(0xff11ff11)]
    const bigIntsBE = [BigInt(0x01ff01ff), BigInt(0x11ff11ff)]

    group.each.setup(() => {
        cache = Cache.alloc(8)
        for (let i = 0; i < cache.length; i++) {
            cache.writeUint8(bigIntByteValues[i], i)
        }
    })

    test("It should read a BigInt from the cache (little endian)", ({ expect }) => {
        expect(cache.readBigInt(0, 4, "LE")).toBe(bigIntsLE[0])
    })

    test("It should read a BigInt from the cache (big endian)", ({ expect }) => {
        expect(cache.readBigInt(0, 4, "BE")).toBe(bigIntsBE[0])
    })

    test("It should read a BigInt from the cache at the specified byte offset (little endian)", ({ expect }) => {
        expect(cache.readBigInt(4, 4, "LE")).toBe(bigIntsLE[1])
    })

    test("It should read a BigInt from the cache at the specified byte offset (big endian)", ({ expect }) => {
        expect(cache.readBigInt(4, 4, "BE")).toBe(bigIntsBE[1])
    })
})
