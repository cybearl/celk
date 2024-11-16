import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"

test.group("cache / utility / copy", (group) => {
    let cache: Cache
    let copy: Cache
    let partialCopy: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
        copy = cache.copy()
    })

    test("It should create a copy of the cache", ({ expect }) => {
        expect(copy).toBeInstanceOf(Cache)
    })

    test("It should create a copy of the cache with the same length", ({ expect }) => {
        expect(copy.length).toBe(cache.length)
    })

    test("It should create a copy of the cache with the same values", ({ expect }) => {
        for (let i = 0; i < cache.length; i++) {
            expect(copy.readUint8(i)).toBe(cache.readUint8(i))
        }
    })

    test("It should create a partial copy of the cache", ({ expect }) => {
        partialCopy = cache.copy(2, 2)
        expect(partialCopy.length).toBe(2)
        expect(partialCopy.readHexString()).toBe("FF11")
    })
})

test.group("cache / utility / subarray", (group) => {
    let cache: Cache
    let subarray: Cache
    let partialSubarray: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
        subarray = cache.subarray(2, 2)
    })

    test("It should create a subarray of the cache", ({ expect }) => {
        expect(subarray).toBeInstanceOf(Cache)
    })

    test("It should create a subarray of the cache with the correct length", ({ expect }) => {
        expect(subarray.length).toBe(2)
    })

    test("It should create a subarray of the cache with the correct values", ({ expect }) => {
        expect(subarray.readHexString()).toBe("FF11")
    })

    test("It should create a partial subarray of the cache", ({ expect }) => {
        partialSubarray = cache.subarray(0, 2)
        expect(partialSubarray.length).toBe(2)
        expect(partialSubarray.readHexString()).toBe("FF11")
    })
})

test.group("cache / utility / swap", (group) => {
    let cache: Cache
    let swapped: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
        swapped = cache.swap()
    })

    test("It should create a cache with the swapped endianness", ({ expect }) => {
        expect(swapped.readHexString()).toBe("11FF11FF")
    })
})

test.group("cache / utility / partialReverse", (group) => {
    let cache: Cache
    let partialReversed: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
        partialReversed = cache.partialReverse(2, 2)
    })

    test("It should create a cache with the partially reversed values", ({ expect }) => {
        expect(partialReversed.readHexString()).toBe("FF1111FF")
    })
})

test.group("cache / utility / reverse", (group) => {
    let cache: Cache
    let reversed: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
        reversed = cache.reverse()
    })

    test("It should create a cache with the reversed values", ({ expect }) => {
        expect(reversed.readHexString()).toBe("11FF11FF")
    })
})

test.group("cache / utility / rotateLeft", (group) => {
    let cache: Cache
    let rotated: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("2211FF11")
        rotated = cache.rotateLeft()
    })

    test("It should create a cache with the rotated values", ({ expect }) => {
        expect(rotated.readHexString()).toBe("11FF1122")
    })
})

test.group("cache / utility / rotateRight", (group) => {
    let cache: Cache
    let rotated: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF22")
        rotated = cache.rotateRight()
    })

    test("It should create a cache with the rotated values", ({ expect }) => {
        expect(rotated.readHexString()).toBe("22FF11FF")
    })
})

test.group("cache / utility / shiftLeft", (group) => {
    let cache: Cache
    let shifted: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
        shifted = cache.shiftLeft()
    })

    test("It should create a cache with the shifted values", ({ expect }) => {
        expect(shifted.readHexString()).toBe("11FF1100")
    })
})

test.group("cache / utility / shiftRight", (group) => {
    let cache: Cache
    let shifted: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
        shifted = cache.shiftRight()
    })

    test("It should create a cache with the shifted values", ({ expect }) => {
        expect(shifted.readHexString()).toBe("00FF11FF")
    })
})

test.group("cache / utility / fill", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = Cache.alloc(10)
    })

    test("It should fill the cache with a value", ({ expect }) => {
        cache.fill(0xff)

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(0xff)
        }
    })

    test("It should fill the cache with a value at the specified offset", ({ expect }) => {
        cache.fill(0xff, 5, 5)

        for (let i = 0; i < cache.length; i++) {
            if (i < 5) {
                expect(cache.readUint8(i)).toBe(0x00)
            } else {
                expect(cache.readUint8(i)).toBe(0xff)
            }
        }
    })

    test("It should throw if the value is not a valid uint8", ({ expect }) => {
        expect(() => cache.fill(-1)).toThrow()
        expect(() => cache.fill(0x100)).toThrow()
    })
})

test.group("cache / utility / clear", (group) => {
    let cache: Cache

    group.each.setup(() => {
        cache = Cache.fromHexString("FF11FF11")
    })

    test("It should clear the cache", ({ expect }) => {
        cache.clear()

        for (let i = 0; i < cache.length; i++) {
            expect(cache.readUint8(i)).toBe(0x00)
        }
    })
})
