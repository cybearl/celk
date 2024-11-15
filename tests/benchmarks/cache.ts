import Cache, { Bit } from "#kernel/cache"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Cache` class.
 * @param benchmarkInputSize The size of the input for the benchmark.
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeCacheBenchmark(benchmarkInputSize: number, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the cache...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(`>> Benchmark input size: ${benchmarkInputSize.toLocaleString("en-US")}`)

    // Test values
    const oneBitArray: Bit[] = [0]
    const randomBitArray: Bit[] = new Array(benchmarkInputSize).fill(0)
    for (let i = 0; i < benchmarkInputSize; i++) randomBitArray[i] = Math.floor(Math.random() * 2) as Bit

    const oneUint8Array = new Uint8Array(1)
    oneUint8Array[0] = 0xff
    const randomUint8Array = new Uint8Array(benchmarkInputSize)
    for (let i = 0; i < benchmarkInputSize; i++) randomUint8Array[i] = Math.floor(Math.random() * 0xff)

    const oneUint16Array = new Uint16Array(1)
    oneUint16Array[0] = 0xffff
    const randomUint16Array: Uint16Array = new Uint16Array(benchmarkInputSize / 2)
    for (let i = 0; i < benchmarkInputSize / 2; i++) randomUint16Array[i] = Math.floor(Math.random() * 0xffff)

    const oneUint32Array = new Uint32Array(1)
    oneUint32Array[0] = 0xffffffff
    const randomUint32Array: Uint32Array = new Uint32Array(benchmarkInputSize / 4)
    for (let i = 0; i < benchmarkInputSize / 4; i++) randomUint32Array[i] = Math.floor(Math.random() * 0xffffffff)

    const oneHex = "A".repeat(2)
    const randomHex = "A".repeat(benchmarkInputSize * 2)

    const oneUtf8 = "A"
    const randomUtf8 = "A".repeat(benchmarkInputSize)

    const oneBigInt = BigInt(0x1)
    const randomBigInt = BigInt(`0x${randomHex.slice(0, benchmarkInputSize)}`)

    // Test cache instances
    const cache = Cache.alloc(benchmarkInputSize)
    const cacheX8 = Cache.alloc(benchmarkInputSize * 8)
    const emptyCache = Cache.alloc(1)
    const firstEqualCache = Cache.alloc(benchmarkInputSize)
    const secondEqualCache = Cache.alloc(benchmarkInputSize)
    const firstUnequalCache = Cache.fromHexString(randomHex)
    const secondUnequalCache = Cache.fromHexString(randomHex.split("").reverse().join(""))

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => cache.check(0, 1), "check")
    bench.benchmark(() => cache.normalizeEndianness("BE"), "normalizeEndianness")
    bench.print("general")

    bench.benchmark(() => Cache.alloc(1), "alloc")
    bench.benchmark(() => Cache.fromHexString("aa"), "fromHexString")
    bench.benchmark(() => Cache.fromUtf8String("a"), "fromUtf8String")
    bench.benchmark(() => Cache.fromBits(oneBitArray), "fromBits")
    bench.benchmark(() => Cache.fromUint8Array(oneUint8Array), "fromUint8Array")
    bench.benchmark(() => Cache.fromUint16Array(oneUint16Array), "fromUint16Array")
    bench.benchmark(() => Cache.fromUint32Array(oneUint32Array), "fromUint32Array")
    bench.print("static")

    bench.benchmark(() => Cache.alloc(benchmarkInputSize), `alloc(${benchmarkInputSize})`)
    bench.benchmark(() => Cache.fromHexString(randomHex), `fromHexString(${randomHex.length})`)
    bench.benchmark(() => Cache.fromUtf8String(randomUtf8), `fromUtf8String(${randomUtf8.length})`)
    bench.benchmark(() => Cache.fromBits(randomBitArray), `fromBits(${randomBitArray.length})`)
    bench.benchmark(() => Cache.fromUint8Array(randomUint8Array), `fromUint8Array(${randomUint8Array.length})`)
    bench.benchmark(() => Cache.fromUint16Array(randomUint16Array), `fromUint16Array(${randomUint16Array.length})`)
    bench.benchmark(() => Cache.fromUint32Array(randomUint32Array), `fromUint32Array(${randomUint32Array.length})`)
    bench.print("static (multiple)")

    bench.benchmark(() => cache.writeBit(1), `writeBit`)
    bench.benchmark(() => cache.writeUint8(0xff), `writeUint8`)
    bench.benchmark(() => cache.writeUint16LE(0xffff), `writeUint16LE`)
    bench.benchmark(() => cache.writeUint16BE(0xffff), `writeUint16BE`)
    bench.benchmark(() => cache.writeUint16(0xffff), `writeUint16`)
    bench.benchmark(() => cache.writeUint32LE(0xffffffff), `writeUint32LE`)
    bench.benchmark(() => cache.writeUint32BE(0xffffffff), `writeUint32BE`)
    bench.benchmark(() => cache.writeUint32(0xffffffff), `writeUint32`)
    bench.print("write (single-only)")

    bench.benchmark(() => cache.writeHexString(oneHex), `writeHexString(1)`)
    bench.benchmark(() => cache.writeUtf8String(oneUtf8), `writeUtf8String(1)`)
    bench.benchmark(() => cache.writeString(oneHex, "hex"), `writeString(1:hex)`)
    bench.benchmark(() => cache.writeString(oneUtf8, "utf8"), `writeString(1:utf8)`)
    bench.benchmark(() => cache.writeBits(oneBitArray), `writeBigIntLE(1)`)
    bench.benchmark(() => cache.writeUint8Array(oneUint8Array), `writeUint8Array(1)`)
    bench.benchmark(() => cache.writeUint16Array(oneUint16Array), `writeUint16Array(1)`)
    bench.benchmark(() => cache.writeUint32Array(oneUint32Array), `writeUint32Array(1)`)
    bench.benchmark(() => cache.writeBigIntLE(oneBigInt), `writeBigIntLE(1)`)
    bench.benchmark(() => cache.writeBigIntBE(oneBigInt), `writeBigIntBE(1)`)
    bench.benchmark(() => cache.writeBigInt(oneBigInt), `writeBigInt(1)`)
    bench.print("write (single)")

    bench.benchmark(() => cache.writeHexString(randomHex), `writeHexString(${randomHex.length})`)
    bench.benchmark(() => cache.writeUtf8String(randomUtf8), `writeUtf8String(${randomUtf8.length})`)
    bench.benchmark(() => cache.writeString(randomHex, "hex"), `writeString(${randomHex.length}:hex)`)
    bench.benchmark(() => cache.writeString(randomUtf8, "utf8"), `writeString(${randomUtf8.length}:utf8)`)
    bench.benchmark(() => cache.writeBits(randomBitArray), `writeBits(${randomBitArray.length})`)
    bench.benchmark(() => cache.writeUint8Array(randomUint8Array), `writeUint8Array(${randomUint8Array.length})`)
    bench.benchmark(() => cache.writeUint16Array(randomUint16Array), `writeUint16Array(${randomUint16Array.length})`)
    bench.benchmark(() => cache.writeUint32Array(randomUint32Array), `writeUint32Array(${randomUint32Array.length})`)
    bench.benchmark(() => cache.writeBigIntLE(randomBigInt), `writeBigIntLE(${randomBigInt.toString().length})`)
    bench.benchmark(() => cache.writeBigIntBE(randomBigInt), `writeBigIntBE(${randomBigInt.toString().length})`)
    bench.benchmark(() => cache.writeBigInt(randomBigInt), `writeBigInt(${randomBigInt.toString().length})`)
    bench.print("write (multiple)")

    bench.benchmark(() => cache.readBit(0), "readBit")
    bench.benchmark(() => cache.readUint8(0), "readUint8")
    bench.benchmark(() => cache.readUint16LE(0), "readUint16LE")
    bench.benchmark(() => cache.readUint16BE(0), "readUint16BE")
    bench.benchmark(() => cache.readUint16(0), "readUint16")
    bench.benchmark(() => cache.readUint32LE(0), "readUint32LE")
    bench.benchmark(() => cache.readUint32BE(0), "readUint32BE")
    bench.benchmark(() => cache.readUint32(0), "readUint32")
    bench.print("read (single-only)")

    bench.benchmark(() => cache.readHexString(0, 1), "readHexString(1)")
    bench.benchmark(() => cache.readUtf8String(0, 1), "readUtf8String(1)")
    bench.benchmark(() => cache.readString(0, 1, "hex"), "readString(1:hex)")
    bench.benchmark(() => cache.readString(0, 1, "utf8"), "readString(1:utf8)")
    bench.benchmark(() => cache.readBits(0, 1), "readBits(1)")
    bench.benchmark(() => cache.readUint8Array(0, 1), "readUint8Array(1)")
    bench.benchmark(() => cache.readUint16Array(0, 1), "readUint16Array(1)")
    bench.benchmark(() => cache.readUint32Array(0, 1), "readUint32Array(1)")
    bench.benchmark(() => cache.readBigIntLE(0, 1), "readBigIntLE(1)")
    bench.benchmark(() => cache.readBigIntBE(0, 1), "readBigIntBE(1)")
    bench.benchmark(() => cache.readBigInt(0, 1), "readBigInt(1)")
    bench.print("read (single)")

    bench.benchmark(() => cache.readHexString(0, benchmarkInputSize), `readHexString(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readUtf8String(0, benchmarkInputSize), `readUtf8String(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readString(0, benchmarkInputSize, "hex"), `readString(${benchmarkInputSize}:hex)`)
    bench.benchmark(() => cache.readString(0, benchmarkInputSize, "utf8"), `readString(${benchmarkInputSize}:utf8)`)
    bench.benchmark(() => cache.readBits(0, benchmarkInputSize), `readBits(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readUint8Array(0, benchmarkInputSize), `readUint8Array(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readUint16Array(0, benchmarkInputSize), `readUint16Array(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readUint32Array(0, benchmarkInputSize), `readUint32Array(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readBigIntLE(0, benchmarkInputSize), `readBigIntLE(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readBigIntBE(0, benchmarkInputSize), `readBigIntBE(${benchmarkInputSize})`)
    bench.benchmark(() => cache.readBigInt(0, benchmarkInputSize), `readBigInt(${benchmarkInputSize})`)
    bench.print("read (multiple)")

    bench.benchmark(() => cache.toHexString(), `toHexString(${randomHex.length})`)
    bench.benchmark(() => cache.toUtf8String(), `toUtf8String(${randomHex.length})`)
    bench.benchmark(() => cache.toString("hex"), `toString(hex)`)
    bench.benchmark(() => cache.toString("utf8"), `toString(utf8)`)
    bench.benchmark(() => cache.toBits(), `toBits(${randomHex.length})`)
    bench.benchmark(() => cache.toUint8Array(), `toUint8Array(${randomHex.length})`)
    bench.benchmark(() => cache.toUint16Array(), `toUint16Array(${randomHex.length})`)
    bench.benchmark(() => cache.toUint32Array(), `toUint32Array(${randomHex.length})`)
    bench.print("convert")

    bench.benchmark(() => firstEqualCache.equals(secondEqualCache), "equals(true)")
    bench.benchmark(() => firstUnequalCache.equals(secondUnequalCache), "equals(false)")
    bench.benchmark(() => cache.isEmpty(), `isEmpty(${benchmarkInputSize})`)
    bench.benchmark(() => emptyCache.isEmpty(), `isEmpty(1)`)
    bench.print("check")

    bench.benchmark(() => cache.randomFill(), `randomFill(${benchmarkInputSize})`)
    bench.benchmark(() => cacheX8.randomFill(), `randomFill(${benchmarkInputSize * 8})`)
    bench.benchmark(() => cache.safeRandomFill(), `safeRandomFill(${benchmarkInputSize})`)
    bench.benchmark(() => cacheX8.safeRandomFill(), `safeRandomFill(${benchmarkInputSize * 8})`)
    bench.print("random")

    bench.benchmark(() => cache.copy(0, benchmarkInputSize), "copy")
    bench.benchmark(() => cache.subarray(0, benchmarkInputSize), "subarray")
    bench.benchmark(() => cache.swap(0, benchmarkInputSize), "swap")
    bench.benchmark(() => cache.partialReverse(0, benchmarkInputSize / 2), `partialReverse(${benchmarkInputSize / 2})`)
    bench.benchmark(() => cache.reverse(), "reverse")
    bench.benchmark(() => cache.rotateLeft(), "rotateLeft")
    bench.benchmark(() => cache.rotateRight(), "rotateRight")
    bench.benchmark(() => cache.shiftLeft(), "shiftLeft")
    bench.benchmark(() => cache.shiftRight(), "shiftRight")
    bench.benchmark(() => cache.fill(0xff), "fill")
    bench.benchmark(() => cache.clear(), "clear")
    bench.print("utility")
}
