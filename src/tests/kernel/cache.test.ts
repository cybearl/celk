import { expect } from "@jest/globals";

import Cache from "lib/kernel/cache";


describe("Cache", () => {
    describe("Getters", () => {
        let cache: Cache;

        beforeEach(() => {
            cache = new Cache(10);
        });

        it("Should return the ArrayBuffer instance referenced by the cache", () => {
            expect(cache.buffer).toBeInstanceOf(ArrayBuffer);
        });

        it("Should return the initial offset of the cache compared to the buffer's `byteOffset` (byteOffset)", () => {
            expect(cache.byteOffset).toBe(0);
        });

        it("Should return the initial offset of the cache compared to the buffer's `byteOffset` (offset)", () => {
            expect(cache.offset).toBe(0);
        });

        it("Should return the cache length (byteLength)", () => {
            expect(cache.byteLength).toBe(10);
        });

        it("Should return the cache length (length)", () => {
            expect(cache.length).toBe(10);
        });
    });

    describe("General method", () => {
        describe("check", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = new Cache(10);
            });

            it("Should throw if the offset is an invalid number", () => {
                expect(() => cache.check(NaN, 0)).toThrow();
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                expect(() => cache.check("Z", 0)).toThrow();
            });

            it("Should throw if the length is an invalid number", () => {
                expect(() => cache.check(0, NaN)).toThrow();
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                expect(() => cache.check(0, "Z")).toThrow();
            });

            it("Should throw if the offset is negative", () => {
                expect(() => cache.check(-1, 0)).toThrow();
            });

            it("Should throw if the offset is greater than the cache length", () => {
                expect(() => cache.check(10, 0)).toThrow();
            });

            it("Should throw if the length is negative", () => {
                expect(() => cache.check(0, -1)).toThrow();
            });

            it("Should throw if the length is greater than the cache length", () => {
                expect(() => cache.check(0, 11)).toThrow();
            });

            it("Should throw if the offset + the length is greater than the cache length", () => {
                expect(() => cache.check(9, 2)).toThrow();
            });

            it("Should throw if the offset modulo 1 is not 0", () => {
                expect(() => cache.check(0.5, 0)).toThrow();
            });

            it("Should throw if the length modulo 1 is not 0", () => {
                expect(() => cache.check(0, 0.5)).toThrow();
            });

            it("Should not throw if the offset and length are valid", () => {
                expect(() => cache.check(0, 10)).not.toThrow();
            });
        });
    });

    describe("Iterators", () => {
        describe("Symbol iterator", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = new Cache(10);
            });

            it("Should iterate over the cache", () => {
                const cacheValues = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09];
                let i = 0;

                for (let i = 0; i < cache.length; i++) {
                    cache.writeUint8(i, i);
                }

                for (const value of cache) {
                    expect(value).toBe(cacheValues[i]);
                    i++;
                }
            });
        });

        describe("Entries", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = new Cache(10);
            });

            it("Should iterate over the cache entries", () => {
                const cacheEntries = [
                    [0, 0x00], [1, 0x01], [2, 0x02], [3, 0x03], [4, 0x04],
                    [5, 0x05], [6, 0x06], [7, 0x07], [8, 0x08], [9, 0x09]
                ];
                let i = 0;

                for (let i = 0; i < cache.length; i++) {
                    cache.writeUint8(i, i);
                }

                for (const entry of cache.entries()) {
                    expect(entry).toEqual(cacheEntries[i]);
                    i++;
                }
            });
        });
    });

    describe("Static methods", () => {
        describe("alloc", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = Cache.alloc(10);
            });

            it("Should allocate a cache", () => {
                expect(cache).toBeInstanceOf(Cache);
            });

            it("Should allocate a cache with the specified length", () => {
                expect(cache.length).toBe(10);
            });

            it("Should use a SharedArrayBuffer by default", () => {
                expect(cache.buffer).toBeInstanceOf(SharedArrayBuffer);
            });

            it("Should use an ArrayBuffer if specified", () => {
                cache = Cache.alloc(10, false);
                expect(cache.buffer).toBeInstanceOf(ArrayBuffer);
            });
        });

        describe("fromHexString", () => {
            let cache: Cache;
            const hexString = "FF00FF00";
            const hexStringByteValues = [0xFF, 0x00, 0xFF, 0x00];

            beforeEach(() => {
                cache = Cache.fromHexString(hexString);
            });

            it("Should create a cache from a hex string", () => {
                expect(cache).toBeInstanceOf(Cache);
            });

            it("Should create a cache with the correct length", () => {
                expect(cache.length).toBe(Math.ceil(hexString.length / 2));
            });

            it("Should create a cache with the correct values", () => {
                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(hexStringByteValues[i]);
                }
            });
        });

        describe("fromUtf8String", () => {
            const utf8String = "Hello, world!";
            const utf8StringByteValues = [0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x77, 0x6F, 0x72, 0x6C, 0x64, 0x21];

            it("Should create a cache from a UTF-8 string", () => {
                const cache = Cache.fromUtf8String(utf8String);
                expect(cache).toBeInstanceOf(Cache);
            });

            it("Should create a cache with the correct length", () => {
                const cache = Cache.fromUtf8String(utf8String);
                expect(cache.length).toBe(utf8String.length);
            });

            it("Should create a cache with the correct values", () => {
                const cache = Cache.fromUtf8String(utf8String);

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(utf8StringByteValues[i]);
                }
            });
        });

        describe("fromUint8Array", () => {
            let cache: Cache;
            const uint8Array = new Uint8Array([0xFF, 0x11, 0xFF, 0x11]);

            beforeEach(() => {
                cache = Cache.fromUint8Array(uint8Array);
            });

            it("Should create a cache from a Uint8Array", () => {
                expect(cache).toBeInstanceOf(Cache);
            });

            it("Should create a cache with the correct length", () => {
                expect(cache.length).toBe(uint8Array.length);
            });

            it("Should create a cache with the correct values", () => {
                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint8Array[i]);
                }
            });
        });
    });

    describe("Write methods", () => {
        describe("writeHexString", () => {
            let cache: Cache;
            const hexString = "FF11FF11";
            const hexStringByteValues = [0xFF, 0x11, 0xFF, 0x11];

            beforeEach(() => {
                cache = new Cache(4);
            });

            it("Should write a hex string to the cache", () => {
                cache.writeHexString(hexString);

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(hexStringByteValues[i]);
                }
            });

            it("Should write a hex string to the cache at the specified offset", () => {
                cache.writeHexString("1F1F", 2);
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x1F);
                expect(cache.readUint8(3)).toBe(0x1F);
            });

            it("Should throw if the string is empty", () => {
                expect(() => cache.writeHexString("")).toThrow();
            });

            it("Should throw if the string length is not even", () => {
                expect(() => cache.writeHexString("FF1")).toThrow();
            });
        });

        describe("writeUtf8String", () => {
            let cache: Cache;
            const utf8String = "Hello, world!";
            const utf8StringByteValues = [0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x77, 0x6F, 0x72, 0x6C, 0x64, 0x21];

            beforeEach(() => {
                cache = new Cache(13);
            });

            it("Should write a UTF-8 string to the cache", () => {
                cache.writeUtf8String(utf8String);

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(utf8StringByteValues[i]);
                }
            });

            it("Should write a UTF-8 string to the cache at the specified offset", () => {
                cache.writeUtf8String("ABCD", 2);
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x41);
                expect(cache.readUint8(3)).toBe(0x42);
                expect(cache.readUint8(4)).toBe(0x43);
                expect(cache.readUint8(5)).toBe(0x44);
            });

            it("Should throw if the string is empty", () => {
                expect(() => cache.writeUtf8String("")).toThrow();
            });
        });

        describe("writeUint8", () => {
            let cache: Cache;
            const uint8 = 0xFF;
            const uint8ByteValues = [0xFF, 0x00];

            beforeEach(() => {
                cache = new Cache(2);
            });

            it("Should write a uint8 to the cache", () => {
                cache.writeUint8(uint8);

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)). toBe(uint8ByteValues[i]);
                }
            });

            it("Should write a uint8 to the cache at the specified offset", () => {
                cache.writeUint8(0xFF, 1);
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0xFF);
            });

            it("Should throw if the value is not a valid uint8", () => {
                expect(() => cache.writeUint8(-1)).toThrow();
                expect(() => cache.writeUint8(0x100)).toThrow();
            });
        });

        describe("writeUint16", () => {
            let cache: Cache;
            const uint16 = 0xFF11;
            const uint16ByteValuesLE = [0x11, 0xFF, 0x00, 0x00];
            const uint16ByteValuesBE = [0xFF, 0x11, 0x00, 0x00];

            beforeEach(() => {
                cache = new Cache(4);
            });

            it("Should write a uint16 to the cache (little endian)", () => {
                cache.writeUint16(uint16, 0, "LE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint16ByteValuesLE[i]);
                }
            });

            it("Should write a uint16 to the cache (big endian)", () => {
                cache.writeUint16(uint16, 0, "BE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint16ByteValuesBE[i]);
                }
            });

            it("Should write a uint16 to the cache at the specified byte offset (little endian)", () => {
                cache.writeUint16(0xF11F, 2, "LE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x1F);
                expect(cache.readUint8(3)).toBe(0xF1);
            });

            it("Should write a uint16 to the cache at the specified byte offset (big endian)", () => {
                cache.writeUint16(0xF11F, 2, "BE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0xF1);
                expect(cache.readUint8(3)).toBe(0x1F);
            });

            it("Should throw if the value is not a valid uint16", () => {
                expect(() => cache.writeUint16(-1)).toThrow();
                expect(() => cache.writeUint16(0x10000)).toThrow();
            });

            it("Should throw if the byte offset is not aligned to 2 bytes", () => {
                expect(() => cache.writeUint16(0xFF00, 1)).toThrow();
            });
        });

        describe("writeUint32", () => {
            let cache: Cache;
            const uint32 = 0xFF11FF11;
            const uint32ByteValuesLE = [0x11, 0xFF, 0x11, 0xFF, 0x00, 0x00, 0x00, 0x00];
            const uint32ByteValuesBE = [0xFF, 0x11, 0xFF, 0x11, 0x00, 0x00, 0x00, 0x00];

            beforeEach(() => {
                cache = new Cache(8);
            });

            it("Should write a uint32 to the cache (little endian)", () => {
                cache.writeUint32(uint32, 0, "LE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint32ByteValuesLE[i]);
                }
            });

            it("Should write a uint32 to the cache (big endian)", () => {
                cache.writeUint32(uint32, 0, "BE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint32ByteValuesBE[i]);
                }
            });

            it("Should write a uint32 to the cache at the specified byte offset (little endian)", () => {
                cache.writeUint32(0xFF1FFF1F, 4, "LE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x00);
                expect(cache.readUint8(3)).toBe(0x00);
                expect(cache.readUint8(4)).toBe(0x1F);
                expect(cache.readUint8(5)).toBe(0xFF);
                expect(cache.readUint8(6)).toBe(0x1F);
                expect(cache.readUint8(7)).toBe(0xFF);
            });

            it("Should write a uint32 to the cache at the specified byte offset (big endian)", () => {
                cache.writeUint32(0xFF1FFF1F, 4, "BE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x00);
                expect(cache.readUint8(3)).toBe(0x00);
                expect(cache.readUint8(4)).toBe(0xFF);
                expect(cache.readUint8(5)).toBe(0x1F);
                expect(cache.readUint8(6)).toBe(0xFF);
                expect(cache.readUint8(7)).toBe(0x1F);
            });

            it("Should throw if the value is not a valid uint32", () => {
                expect(() => cache.writeUint32(-1)).toThrow();
                expect(() => cache.writeUint32(0x100000000)).toThrow();
            });

            it("Should throw if the byte offset is not aligned to 4 bytes", () => {
                expect(() => cache.writeUint32(0xFF00FF00, 2)).toThrow();
            });
        });

        describe("writeUint8Array", () => {
            let cache: Cache;
            const uint8Array = new Uint8Array([0xFF, 0x11, 0xFF, 0x11]);

            beforeEach(() => {
                cache = new Cache(4);
            });

            it("Should write a Uint8Array to the cache", () => {
                cache.writeUint8Array(uint8Array);

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint8Array[i]);
                }
            });

            it("Should write a Uint8Array to the cache at the specified offset", () => {
                cache.writeUint8Array(new Uint8Array([0x1F, 0x1F]), 2);
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x1F);
                expect(cache.readUint8(3)).toBe(0x1F);
            });
        });

        describe("writeUint16Array", () => {
            let cache: Cache;
            const uint16Array = new Uint16Array([0xFF11, 0x11FF]);
            const uint16ArrayByteValuesLE = [0x11, 0xFF, 0xFF, 0x11];
            const uint16ArrayByteValuesBE = [0xFF, 0x11, 0x11, 0xFF];

            beforeEach(() => {
                cache = new Cache(4);
            });

            it("Should write a Uint16Array to the cache (little endian)", () => {
                cache.writeUint16Array(uint16Array, 0, 4, "LE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint16ArrayByteValuesLE[i]);
                }
            });

            it("Should write a Uint16Array to the cache (big endian)", () => {
                cache.writeUint16Array(uint16Array, 0, 4, "BE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint16ArrayByteValuesBE[i]);
                }
            });

            it("Should write a Uint16Array to the cache at the specified byte offset (little endian)", () => {
                cache.writeUint16Array(new Uint16Array([0x11FF]), 2, 1, "LE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0xFF);
                expect(cache.readUint8(3)).toBe(0x11);
            });

            it("Should write a Uint16Array to the cache at the specified byte offset (big endian)", () => {
                cache.writeUint16Array(new Uint16Array([0x11FF]), 2, 1, "BE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x11);
                expect(cache.readUint8(3)).toBe(0xFF);
            });
        });

        describe("writeUint32Array", () => {
            let cache: Cache;
            const uint32Array = new Uint32Array([0xFF11FF11, 0x11FF11FF]);
            const uint32ArrayByteValuesLE = [0x11, 0xFF, 0x11, 0xFF, 0xFF, 0x11, 0xFF, 0x11];
            const uint32ArrayByteValuesBE = [0xFF, 0x11, 0xFF, 0x11, 0x11, 0xFF, 0x11, 0xFF];

            beforeEach(() => {
                cache = new Cache(8);
            });

            it("Should write a Uint32Array to the cache (little endian)", () => {
                cache.writeUint32Array(uint32Array, 0, 8, "LE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint32ArrayByteValuesLE[i]);
                }
            });

            it("Should write a Uint32Array to the cache (big endian)", () => {
                cache.writeUint32Array(uint32Array, 0, 8, "BE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(uint32ArrayByteValuesBE[i]);
                }
            });

            it("Should write a Uint32Array to the cache at the specified byte offset (little endian)", () => {
                cache.writeUint32Array(new Uint32Array([0xF1FF1FFF]), 4, 1, "LE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x00);
                expect(cache.readUint8(3)).toBe(0x00);
                expect(cache.readUint8(4)).toBe(0xFF);
                expect(cache.readUint8(5)).toBe(0x1F);
                expect(cache.readUint8(6)).toBe(0xFF);
                expect(cache.readUint8(7)).toBe(0xF1);
            });

            it("Should write a Uint32Array to the cache at the specified byte offset (big endian)", () => {
                cache.writeUint32Array(new Uint32Array([0xF1FF1FFF]), 4, 1, "BE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x00);
                expect(cache.readUint8(3)).toBe(0x00);
                expect(cache.readUint8(4)).toBe(0xF1);
                expect(cache.readUint8(5)).toBe(0xFF);
                expect(cache.readUint8(6)).toBe(0x1F);
                expect(cache.readUint8(7)).toBe(0xFF);
            });
        });

        describe("writeBigInt", () => {
            let cache: Cache;
            const bigInt = BigInt(0xFF11FF11FF11);
            const bigIntByteValuesLE = [0x11, 0xFF, 0x11, 0xFF, 0x11, 0xFF, 0x00, 0x00];
            const bigIntByteValuesBE = [0xFF, 0x11, 0xFF, 0x11, 0xFF, 0x11, 0x00, 0x00];

            beforeEach(() => {
                cache = new Cache(8);
            });

            it("Should write a BigInt to the cache (little endian)", () => {
                cache.writeBigInt(bigInt, 0, undefined, "LE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(bigIntByteValuesLE[i]);
                }
            });

            it("Should write a BigInt to the cache (big endian)", () => {
                cache.writeBigInt(bigInt, 0, undefined, "BE");

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(bigIntByteValuesBE[i]);
                }
            });

            it("Should write a BigInt to the cache at the specified offset (little endian)", () => {
                cache.writeBigInt(BigInt(0x1F2F3F4F), 4, undefined, "LE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x00);
                expect(cache.readUint8(3)).toBe(0x00);
                expect(cache.readUint8(4)).toBe(0x4F);
                expect(cache.readUint8(5)).toBe(0x3F);
                expect(cache.readUint8(6)).toBe(0x2F);
                expect(cache.readUint8(7)).toBe(0x1F);
            });

            it("Should write a BigInt to the cache at the specified offset (big endian)", () => {
                cache.writeBigInt(BigInt(0x1F2F3F4F), 4, undefined, "BE");
                expect(cache.readUint8(0)).toBe(0x00);
                expect(cache.readUint8(1)).toBe(0x00);
                expect(cache.readUint8(2)).toBe(0x00);
                expect(cache.readUint8(3)).toBe(0x00);
                expect(cache.readUint8(4)).toBe(0x1F);
                expect(cache.readUint8(5)).toBe(0x2F);
                expect(cache.readUint8(6)).toBe(0x3F);
                expect(cache.readUint8(7)).toBe(0x4F);
            });

            it("Should throw if the value is not a valid BigInt", () => {
                expect(() => cache.writeBigInt(BigInt(-1))).toThrow();
            });
        });
    });

    describe("Read methods", () => {
        describe("readHexString", () => {
            let cache: Cache;
            const hexString = "FF21FF11";

            beforeEach(() => {
                cache = Cache.fromHexString(hexString);
            });

            it("Should read a hex string from the cache", () => {
                expect(cache.readHexString()).toBe(hexString);
            });

            it("Should read a hex string from the cache at the specified offset", () => {
                expect(cache.readHexString(1, 3)).toBe("21FF11");
                expect(cache.readHexString(2, 2)).toBe("FF11");
                expect(cache.readHexString(3, 1)).toBe("11");
            });
        });

        describe("readUtf8String", () => {
            let cache: Cache;
            const utf8String = "Hello, world!";

            beforeEach(() => {
                cache = Cache.fromUtf8String(utf8String);
            });

            it("Should read a UTF-8 string from the cache", () => {
                expect(cache.readUtf8String()).toBe(utf8String);
            });

            it("Should read a UTF-8 string from the cache at the specified offset", () => {
                expect(cache.readUtf8String(1)).toBe("ello, world!");
                expect(cache.readUtf8String(2)).toBe("llo, world!");
                expect(cache.readUtf8String(3)).toBe("lo, world!");
            });
        });

        describe("readUint8", () => {
            let cache: Cache;
            const uint8s = [0xFF, 0x1F];

            beforeEach(() => {
                cache = Cache.alloc(2);
                for (let i = 0; i < cache.length; i++) {
                    cache.writeUint8(uint8s[i], i);
                }
            });

            it("Should read a uint8 from the cache", () => {
                expect(cache.readUint8()).toBe(uint8s[0]);
            });

            it("Should read a uint8 from the cache at the specified offset", () => {
                expect(cache.readUint8(1)).toBe(uint8s[1]);
            });
        });

        describe("readUint16", () => {
            let cache: Cache;
            const uint16sByteValues = [0xFF, 0x11, 0x1F, 0x1F];
            const uint16sLE = [0x11FF, 0x1F1F];
            const uint16sBE = [0xFF11, 0x1F1F];

            beforeEach(() => {
                cache = Cache.alloc(4);
                for (let i = 0; i < cache.length; i++) {
                    cache.writeUint8(uint16sByteValues[i], i);
                }
            });

            it("Should read a uint16 from the cache (little endian)", () => {
                expect(cache.readUint16(0, "LE")).toBe(uint16sLE[0]);
            });

            it("Should read a uint16 from the cache (big endian)", () => {
                expect(cache.readUint16(0, "BE")).toBe(uint16sBE[0]);
            });

            it("Should read a uint16 from the cache at the specified byte offset (little endian)", () => {
                expect(cache.readUint16(2, "LE")).toBe(uint16sLE[1]);
            });

            it("Should read a uint16 from the cache at the specified byte offset (big endian)", () => {
                expect(cache.readUint16(2, "BE")).toBe(uint16sBE[1]);
            });

            it("Should throw if the byte offset is not aligned to 2 bytes", () => {
                expect(() => cache.readUint16(1)).toThrow();
            });
        });

        describe("readUint32", () => {
            let cache: Cache;
            const uint32sByteValues = [0xFF, 0x22, 0xFF, 0x11, 0x1F, 0x1F, 0x1F, 0x1F];
            const uint32sLE = [0x11FF22FF, 0x1F1F1F1F];
            const uint32sBE = [0xFF22FF11, 0x1F1F1F1F];

            beforeEach(() => {
                cache = Cache.alloc(8);
                for (let i = 0; i < cache.length; i++) {
                    cache.writeUint8(uint32sByteValues[i], i);
                }
            });

            it("Should read a uint32 from the cache (little endian)", () => {
                expect(cache.readUint32(0, "LE")).toBe(uint32sLE[0]);
            });

            it("Should read a uint32 from the cache (big endian)", () => {
                expect(cache.readUint32(0, "BE")).toBe(uint32sBE[0]);
            });

            it("Should read a uint32 from the cache at the specified byte offset (little endian)", () => {
                expect(cache.readUint32(4, "LE")).toBe(uint32sLE[1]);
            });

            it("Should read a uint32 from the cache at the specified byte offset (big endian)", () => {
                expect(cache.readUint32(4, "BE")).toBe(uint32sBE[1]);
            });

            it("Should throw if the byte offset is not aligned to 4 bytes", () => {
                expect(() => cache.readUint32(2)).toThrow();
            });
        });

        describe("readBigInt", () => {
            let cache: Cache;
            const bigIntByteValues = [0xFF, 0x01, 0xFF, 0x01, 0xFF, 0x11, 0xFF, 0x11];
            const bigIntsLE = [BigInt(0xFF01FF01), BigInt(0xFF11FF11)];
            const bigIntsBE = [BigInt(0x01FF01FF), BigInt(0x11FF11FF)];

            beforeEach(() => {
                cache = Cache.alloc(8);
                for (let i = 0; i < cache.length; i++) {
                    cache.writeUint8(bigIntByteValues[i], i);
                }
            });

            it("Should read a BigInt from the cache (little endian)", () => {
                expect(cache.readBigInt(0, 4, "LE")).toBe(bigIntsLE[0]);
            });

            it("Should read a BigInt from the cache (big endian)", () => {
                expect(cache.readBigInt(0, 4, "BE")).toBe(bigIntsBE[0]);
            });

            it("Should read a BigInt from the cache at the specified byte offset (little endian)", () => {
                expect(cache.readBigInt(4, 4, "LE")).toBe(bigIntsLE[1]);
            });

            it("Should read a BigInt from the cache at the specified byte offset (big endian)", () => {
                expect(cache.readBigInt(4, 4, "BE")).toBe(bigIntsBE[1]);
            });
        });
    });

    describe("Conversion methods", () => {
        describe("toHexString", () => {
            let cache: Cache;
            const hexString = "FF00FF00";

            beforeEach(() => {
                cache = Cache.fromHexString(hexString);
            });

            it("Should convert the cache to a hex string", () => {
                expect(cache.toHexString()).toBe(hexString);
            });

            it("Should convert the cache to a hex string with the '0x' prefix", () => {
                expect(cache.toHexString(true)).toBe(`0x${hexString}`);
            });
        });

        describe("toUtf8String", () => {
            let cache: Cache;
            const utf8String = "Hello, world!";

            beforeEach(() => {
                cache = Cache.fromUtf8String(utf8String);
            });

            it("Should convert the cache to a UTF-8 string", () => {
                expect(cache.toUtf8String()).toBe(utf8String);
            });
        });

        describe("toString", () => {
            let cache: Cache;
            const hexString = "FF00FF00";
            const utf8String = "Hello, world!";

            beforeEach(() => {
                cache = Cache.fromHexString(hexString);
            });

            it("Should convert the cache to an hexadecimal string", () => {
                expect(cache.toString()).toBe(hexString);
            });

            it("Should convert the cache to a an hexadecimal string with the '0x' prefix", () => {
                expect(cache.toString("hex", true)).toBe(`0x${hexString}`);
            });

            it("Should convert the cache to a UTF-8 string", () => {
                cache = Cache.fromUtf8String(utf8String);
                expect(cache.toString("utf8")).toBe(utf8String);
            });
        });

        describe("toUint8Array", () => {
            let cache: Cache;
            const uint8Array = new Uint8Array([0xFF, 0x11, 0xFF, 0x11]);

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
            });

            it("Should convert the cache to a Uint8Array", () => {
                expect(cache.toUint8Array()).toEqual(uint8Array);
            });
        });

        describe("toUint16Array", () => {
            let cache: Cache;
            const uint16Array = new Uint16Array([0x1F1F, 0x1F1F]);

            beforeEach(() => {
                cache = Cache.fromHexString("1F1F1F1F");
            });

            it("Should convert the cache to a Uint16Array", () => {
                expect(cache.toUint16Array()).toEqual(uint16Array);
            });
        });

        describe("toUint32Array", () => {
            let cache: Cache;
            const uint32Array = new Uint32Array([0x1F1F1F1F, 0x1F1F1F1F]);

            beforeEach(() => {
                cache = Cache.fromHexString("1F1F1F1F1F1F1F1F");
            });

            it("Should convert the cache to a Uint32Array", () => {
                expect(cache.toUint32Array()).toEqual(uint32Array);
            });
        });
    });

    describe("Check methods", () => {
        describe("equals", () => {
            let cache1: Cache;
            let cache2: Cache;
            let cache3: Cache;

            beforeEach(() => {
                cache1 = Cache.fromHexString("FF11FF11");
                cache2 = Cache.fromHexString("FF11FF11");
                cache3 = Cache.fromHexString("FF11FF");
            });

            it("Should return true if the caches are equal", () => {
                expect(cache1.equals(cache2)).toBe(true);
            });

            it("Should return false if the caches are not equal", () => {
                cache2.writeUint8(0, 0x00);
                expect(cache1.equals(cache2)).toBe(false);
            });

            it("Should return false if the caches have different lengths", () => {
                expect(cache1.equals(cache3)).toBe(false);
            });
        });

        describe("isEmpty", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = Cache.alloc(4);
            });

            it("Should return true if the cache is empty", () => {
                expect(cache.isEmpty()).toBe(true);
            });

            it("Should return false if the cache is not empty", () => {
                cache.writeUint8(0xFF);
                expect(cache.isEmpty()).toBe(false);
            });
        });
    });

    describe("Random methods", () => {
        describe("randomFill", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = Cache.alloc(10);
            });

            it("Should fill the cache with random values", () => {
                cache.randomFill();

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0);
                    expect(cache.readUint8(i)).toBeLessThanOrEqual(0xFF);
                }
            });

            it("Should fill the cache with random values at the specified offset", () => {
                cache.randomFill(5);

                for (let i = 0; i < cache.length; i++) {
                    if (i < 5) {
                        expect(cache.readUint8(i)).toBe(0x00);
                    } else {
                        expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0);
                        expect(cache.readUint8(i)).toBeLessThanOrEqual(0xFF);
                    }
                }
            });
        });

        describe("safeRandomFill", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = Cache.alloc(10);
            });

            it("Should fill the cache with cryptographically secure random values", () => {
                cache.safeRandomFill();

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0);
                    expect(cache.readUint8(i)).toBeLessThanOrEqual(0xFF);
                }
            });

            it("Should fill the cache with cryptographically secure random values at the specified offset", () => {
                cache.safeRandomFill(5, 5);

                for (let i = 0; i < cache.length; i++) {
                    if (i < 5) {
                        expect(cache.readUint8(i)).toBe(0x00);
                    } else {
                        expect(cache.readUint8(i)).toBeGreaterThanOrEqual(0);
                        expect(cache.readUint8(i)).toBeLessThanOrEqual(0xFF);
                    }
                }
            });
        });
    });

    describe("Utility methods", () => {
        describe("copy", () => {
            let cache: Cache;
            let copy: Cache;
            let partialCopy: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
                copy = cache.copy();
            });

            it("Should create a copy of the cache", () => {
                expect(copy).toBeInstanceOf(Cache);
            });

            it("Should create a copy of the cache with the same length", () => {
                expect(copy.length).toBe(cache.length);
            });

            it("Should create a copy of the cache with the same values", () => {
                for (let i = 0; i < cache.length; i++) {
                    expect(copy.readUint8(i)).toBe(cache.readUint8(i));
                }
            });

            it("Should create a partial copy of the cache", () => {
                partialCopy = cache.copy(2, 2);
                expect(partialCopy.length).toBe(2);
                expect(partialCopy.readHexString()).toBe("FF11");
            });
        });

        describe("subarray", () => {
            let cache: Cache;
            let subarray: Cache;
            let partialSubarray: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
                subarray = cache.subarray(2, 2);
            });

            it("Should create a subarray of the cache", () => {
                expect(subarray).toBeInstanceOf(Cache);
            });

            it("Should create a subarray of the cache with the correct length", () => {
                expect(subarray.length).toBe(2);
            });

            it("Should create a subarray of the cache with the correct values", () => {
                expect(subarray.readHexString()).toBe("FF11");
            });

            it("Should create a partial subarray of the cache", () => {
                partialSubarray = cache.subarray(0, 2);
                expect(partialSubarray.length).toBe(2);
                expect(partialSubarray.readHexString()).toBe("FF11");
            });
        });

        describe("swap", () => {
            let cache: Cache;
            let swapped: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
                swapped = cache.swap();
            });

            it("Should create a cache with the swapped endianness", () => {
                expect(swapped.readHexString()).toBe("11FF11FF");
            });
        });

        describe("partialReverse", () => {
            let cache: Cache;
            let partialReversed: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
                partialReversed = cache.partialReverse(2, 2);
            });

            it("Should create a cache with the partially reversed values", () => {
                expect(partialReversed.readHexString()).toBe("FF1111FF");
            });
        });

        describe("reverse", () => {
            let cache: Cache;
            let reversed: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
                reversed = cache.reverse();
            });

            it("Should create a cache with the reversed values", () => {
                expect(reversed.readHexString()).toBe("11FF11FF");
            });
        });

        describe("rotateLeft", () => {
            let cache: Cache;
            let rotated: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("2211FF11");
                rotated = cache.rotateLeft();
            });

            it("Should create a cache with the rotated values", () => {
                expect(rotated.readHexString()).toBe("11FF1122");
            });
        });

        describe("rotateRight", () => {
            let cache: Cache;
            let rotated: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF22");
                rotated = cache.rotateRight();
            });

            it("Should create a cache with the rotated values", () => {
                expect(rotated.readHexString()).toBe("22FF11FF");
            });
        });

        describe("shiftLeft", () => {
            let cache: Cache;
            let shifted: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
                shifted = cache.shiftLeft();
            });

            it("Should create a cache with the shifted values", () => {
                expect(shifted.readHexString()).toBe("11FF1100");
            });
        });

        describe("shiftRight", () => {
            let cache: Cache;
            let shifted: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
                shifted = cache.shiftRight();
            });

            it("Should create a cache with the shifted values", () => {
                expect(shifted.readHexString()).toBe("00FF11FF");
            });
        });

        describe("fill", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = Cache.alloc(10);
            });

            it("Should fill the cache with a value", () => {
                cache.fill(0xFF);

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(0xFF);
                }
            });

            it("Should fill the cache with a value at the specified offset", () => {
                cache.fill(0xFF, 5, 5);

                for (let i = 0; i < cache.length; i++) {
                    if (i < 5) {
                        expect(cache.readUint8(i)).toBe(0x00);
                    } else {
                        expect(cache.readUint8(i)).toBe(0xFF);
                    }
                }
            });

            it("Should throw if the value is not a valid uint8", () => {
                expect(() => cache.fill(-1)).toThrow();
                expect(() => cache.fill(0x100)).toThrow();
            });
        });

        describe("clear", () => {
            let cache: Cache;

            beforeEach(() => {
                cache = Cache.fromHexString("FF11FF11");
            });

            it("Should clear the cache", () => {
                cache.clear();

                for (let i = 0; i < cache.length; i++) {
                    expect(cache.readUint8(i)).toBe(0x00);
                }
            });
        });
    });
});