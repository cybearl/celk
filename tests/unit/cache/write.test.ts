import Cache, { Bit } from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / write / writeHexString", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(4)
    })

    const hexString = "FF11FF11"
    const hexStringByteValues = [0xff, 0x11, 0xff, 0x11]

    test("It should write a hex string to the cache", ({ expect }) => {
        cache.writeHexString(hexString)

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(hexStringByteValues[i])
        }
    })

    test("It should write a hex string starting with 0x to the cache", ({ expect }) => {
        cache.writeHexString(`0x${hexString}`)

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(hexStringByteValues[i])
        }
    })

    test("It should write a hex string to the cache at the specified offset", ({ expect }) => {
        cache.writeHexString("1F1F", 2)
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x1f)
        expect(cache.readUint8(3)).toBe(0x1f)
    })

    test("It should throw if the string is empty", ({ expect }) => {
        expect(() => cache.writeHexString("")).toThrow()
    })

    test("It should throw if the string length is not even", ({ expect }) => {
        expect(() => cache.writeHexString("FF1")).toThrow()
    })
})

test.group("cache / write / writeUtf8String", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(13)
    })

    const utf8String = "Hello, world!"
    const utf8StringByteValues = [0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]

    test("It should write a UTF-8 string to the cache", ({ expect }) => {
        cache.writeUtf8String(utf8String)

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(utf8StringByteValues[i])
        }
    })

    test("It should write a UTF-8 string to the cache at the specified offset", ({ expect }) => {
        cache.writeUtf8String("ABCD", 2)
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x41)
        expect(cache.readUint8(3)).toBe(0x42)
        expect(cache.readUint8(4)).toBe(0x43)
        expect(cache.readUint8(5)).toBe(0x44)
    })

    test("It should throw if the string is empty", ({ expect }) => {
        expect(() => cache.writeUtf8String("")).toThrow()
    })
})

test.group("cache / write / writeBit", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(1)
    })

    const bits: Bit[] = [0, 1, 0, 1, 0, 0, 1, 0]

    test("It should write a bit to the cache", ({ expect }) => {
        for (const [i, bit] of bits.entries()) {
            cache.writeBit(bit, i)
        }

        for (let i = 0; i < cache.length * 8; i++) {
            expect(cache.readBit(i)).toBe(bits[i])
        }
    })

    test("It should write a bit to the cache at the specified offset", ({ expect }) => {
        cache.writeBit(1, 1)
        expect(cache.readBit(0)).toBe(0)
        expect(cache.readBit(1)).toBe(1)
    })

    test("It should throw if the value is not a valid bit", ({ expect }) => {
        // @ts-ignore
        expect(() => cache.writeBit(-1)).toThrow()
        // @ts-ignore
        expect(() => cache.writeBit(2)).toThrow()
    })
})

test.group("cache / write / writeUint8", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(2)
    })

    const uint8 = 0xff
    const uint8ByteValues = [0xff, 0x00]

    test("It should write a uint8 to the cache", ({ expect }) => {
        cache.writeUint8(uint8)

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint8ByteValues[i])
        }
    })

    test("It should write a uint8 to the cache at the specified offset", ({ expect }) => {
        cache.writeUint8(0xff, 1)
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0xff)
    })

    test("It should throw if the value is not a valid uint8", ({ expect }) => {
        expect(() => cache.writeUint8(-1)).toThrow()
        expect(() => cache.writeUint8(0x100)).toThrow()
    })
})

test.group("cache / write / writeUint16", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(4)
    })

    const uint16 = 0xff11
    const uint16ByteValuesLE = [0x11, 0xff, 0x00, 0x00]
    const uint16ByteValuesBE = [0xff, 0x11, 0x00, 0x00]

    test("It should write a uint16 to the cache (little endian)", ({ expect }) => {
        cache.writeUint16(uint16, 0, "LE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint16ByteValuesLE[i])
        }
    })

    test("It should write a uint16 to the cache (big endian)", ({ expect }) => {
        cache.writeUint16(uint16, 0, "BE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint16ByteValuesBE[i])
        }
    })

    test("It should write a uint16 to the cache at the specified byte offset (little endian)", ({ expect }) => {
        cache.writeUint16(0xf11f, 2, "LE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x1f)
        expect(cache.readUint8(3)).toBe(0xf1)
    })

    test("It should write a uint16 to the cache at the specified byte offset (big endian)", ({ expect }) => {
        cache.writeUint16(0xf11f, 2, "BE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0xf1)
        expect(cache.readUint8(3)).toBe(0x1f)
    })

    test("It should throw if the value is not a valid uint16", ({ expect }) => {
        expect(() => cache.writeUint16(-1)).toThrow()
        expect(() => cache.writeUint16(0x10000)).toThrow()
    })

    test("It should throw if the byte offset is not aligned to 2 bytes", ({ expect }) => {
        expect(() => cache.writeUint16(0xff00, 1)).toThrow()
    })
})

test.group("cache / write / writeUint32", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(8)
    })

    const uint32 = 0xff11ff11
    const uint32ByteValuesLE = [0x11, 0xff, 0x11, 0xff, 0x00, 0x00, 0x00, 0x00]
    const uint32ByteValuesBE = [0xff, 0x11, 0xff, 0x11, 0x00, 0x00, 0x00, 0x00]

    test("It should write a uint32 to the cache (little endian)", ({ expect }) => {
        cache.writeUint32(uint32, 0, "LE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint32ByteValuesLE[i])
        }
    })

    test("It should write a uint32 to the cache (big endian)", ({ expect }) => {
        cache.writeUint32(uint32, 0, "BE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint32ByteValuesBE[i])
        }
    })

    test("It should write a uint32 to the cache at the specified byte offset (little endian)", ({ expect }) => {
        cache.writeUint32(0xff1fff1f, 4, "LE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x00)
        expect(cache.readUint8(3)).toBe(0x00)
        expect(cache.readUint8(4)).toBe(0x1f)
        expect(cache.readUint8(5)).toBe(0xff)
        expect(cache.readUint8(6)).toBe(0x1f)
        expect(cache.readUint8(7)).toBe(0xff)
    })

    test("It should write a uint32 to the cache at the specified byte offset (big endian)", ({ expect }) => {
        cache.writeUint32(0xff1fff1f, 4, "BE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x00)
        expect(cache.readUint8(3)).toBe(0x00)
        expect(cache.readUint8(4)).toBe(0xff)
        expect(cache.readUint8(5)).toBe(0x1f)
        expect(cache.readUint8(6)).toBe(0xff)
        expect(cache.readUint8(7)).toBe(0x1f)
    })

    test("It should throw if the value is not a valid uint32", ({ expect }) => {
        expect(() => cache.writeUint32(-1)).toThrow()
        expect(() => cache.writeUint32(0x100000000)).toThrow()
    })

    test("It should throw if the byte offset is not aligned to 4 bytes", ({ expect }) => {
        expect(() => cache.writeUint32(0xff00ff00, 2)).toThrow()
    })
})

test.group("cache / write / writeBits", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(1)
    })

    const bits: Bit[] = [0, 1, 0, 1, 0, 0, 1, 0]

    test("It should write bits to the cache", ({ expect }) => {
        cache.writeBits(bits)

        for (let i = 0; i < cache.length * 8; i++) {
            expect(cache.readBit(i)).toBe(bits[i])
        }
    })

    test("It should write bits to the cache at the specified offset", ({ expect }) => {
        cache.writeBits([1, 0, 1, 0], 2)
        expect(cache.readBit(0)).toBe(0)
        expect(cache.readBit(1)).toBe(0)
        expect(cache.readBit(2)).toBe(1)
        expect(cache.readBit(3)).toBe(0)
    })

    test("It should throw if the value is not a valid bit", ({ expect }) => {
        // @ts-ignore
        expect(() => cache.writeBits([0, -1])).toThrow()
        // @ts-ignore
        expect(() => cache.writeBits([0, 2])).toThrow()
    })
})

test.group("cache / write / writeUint8Array", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(4)
    })

    const uint8Array = new Uint8Array([0xff, 0x11, 0xff, 0x11])

    test("It should write a Uint8Array to the cache", ({ expect }) => {
        cache.writeUint8Array(uint8Array)

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint8Array[i])
        }
    })

    test("It should write a Uint8Array to the cache at the specified offset", ({ expect }) => {
        cache.writeUint8Array(new Uint8Array([0x1f, 0x1f]), 2)
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x1f)
        expect(cache.readUint8(3)).toBe(0x1f)
    })
})

test.group("cache / write / writeUint16Array", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(4)
    })

    const uint16Array = new Uint16Array([0xff11, 0x11ff])
    const uint16ArrayByteValuesLE = [0x11, 0xff, 0xff, 0x11]
    const uint16ArrayByteValuesBE = [0xff, 0x11, 0x11, 0xff]

    test("It should write a Uint16Array to the cache (little endian)", ({ expect }) => {
        cache.writeUint16Array(uint16Array, 0, 4, 0, "LE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint16ArrayByteValuesLE[i])
        }
    })

    test("It should write a Uint16Array to the cache (big endian)", ({ expect }) => {
        cache.writeUint16Array(uint16Array, 0, 4, 0, "BE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint16ArrayByteValuesBE[i])
        }
    })

    test("It should write a Uint16Array to the cache at the specified byte offset (little endian)", ({ expect }) => {
        cache.writeUint16Array(new Uint16Array([0x11ff]), 2, 1, 0, "LE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0xff)
        expect(cache.readUint8(3)).toBe(0x11)
    })

    test("It should write a Uint16Array to the cache at the specified byte offset (big endian)", ({ expect }) => {
        cache.writeUint16Array(new Uint16Array([0x11ff]), 2, 1, 0, "BE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x11)
        expect(cache.readUint8(3)).toBe(0xff)
    })
})

test.group("cache / write / writeUint32Array", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(8)
    })

    const uint32Array = new Uint32Array([0xff11ff11, 0x11ff11ff])
    const uint32ArrayByteValuesLE = [0x11, 0xff, 0x11, 0xff, 0xff, 0x11, 0xff, 0x11]
    const uint32ArrayByteValuesBE = [0xff, 0x11, 0xff, 0x11, 0x11, 0xff, 0x11, 0xff]

    test("It should write a Uint32Array to the cache (little endian)", ({ expect }) => {
        cache.writeUint32Array(uint32Array, 0, 8, 0, "LE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint32ArrayByteValuesLE[i])
        }
    })

    test("It should write a Uint32Array to the cache (big endian)", ({ expect }) => {
        cache.writeUint32Array(uint32Array, 0, 8, 0, "BE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(uint32ArrayByteValuesBE[i])
        }
    })

    test("It should write a Uint32Array to the cache at the specified byte offset (little endian)", ({ expect }) => {
        cache.writeUint32Array(new Uint32Array([0xf1ff1fff]), 4, 1, 0, "LE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x00)
        expect(cache.readUint8(3)).toBe(0x00)
        expect(cache.readUint8(4)).toBe(0xff)
        expect(cache.readUint8(5)).toBe(0x1f)
        expect(cache.readUint8(6)).toBe(0xff)
        expect(cache.readUint8(7)).toBe(0xf1)
    })

    test("It should write a Uint32Array to the cache at the specified byte offset (big endian)", ({ expect }) => {
        cache.writeUint32Array(new Uint32Array([0xf1ff1fff]), 4, 1, 0, "BE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x00)
        expect(cache.readUint8(3)).toBe(0x00)
        expect(cache.readUint8(4)).toBe(0xf1)
        expect(cache.readUint8(5)).toBe(0xff)
        expect(cache.readUint8(6)).toBe(0x1f)
        expect(cache.readUint8(7)).toBe(0xff)
    })
})

test.group("cache / write / writeBigInt", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = new Cache(8)
    })

    const bigInt = BigInt(0xff11ff11ff11)
    const bigIntByteValuesLE = [0x11, 0xff, 0x11, 0xff, 0x11, 0xff, 0x00, 0x00]
    const bigIntByteValuesBE = [0xff, 0x11, 0xff, 0x11, 0xff, 0x11, 0x00, 0x00]

    test("It should write a BigInt to the cache (little endian)", ({ expect }) => {
        cache.writeBigInt(bigInt, 0, undefined, "LE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(bigIntByteValuesLE[i])
        }
    })

    test("It should write a BigInt to the cache (big endian)", ({ expect }) => {
        cache.writeBigInt(bigInt, 0, undefined, "BE")

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(bigIntByteValuesBE[i])
        }
    })

    test("It should write a BigInt to the cache at the specified offset (little endian)", ({ expect }) => {
        cache.writeBigInt(BigInt(0x1f2f3f4f), 4, undefined, "LE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x00)
        expect(cache.readUint8(3)).toBe(0x00)
        expect(cache.readUint8(4)).toBe(0x4f)
        expect(cache.readUint8(5)).toBe(0x3f)
        expect(cache.readUint8(6)).toBe(0x2f)
        expect(cache.readUint8(7)).toBe(0x1f)
    })

    test("It should write a BigInt to the cache at the specified offset (big endian)", ({ expect }) => {
        cache.writeBigInt(BigInt(0x1f2f3f4f), 4, undefined, "BE")
        expect(cache.readUint8(0)).toBe(0x00)
        expect(cache.readUint8(1)).toBe(0x00)
        expect(cache.readUint8(2)).toBe(0x00)
        expect(cache.readUint8(3)).toBe(0x00)
        expect(cache.readUint8(4)).toBe(0x1f)
        expect(cache.readUint8(5)).toBe(0x2f)
        expect(cache.readUint8(6)).toBe(0x3f)
        expect(cache.readUint8(7)).toBe(0x4f)
    })

    test("It should throw if the value is not a valid BigInt", ({ expect }) => {
        expect(() => cache.writeBigInt(BigInt(-1))).toThrow()
    })
})
