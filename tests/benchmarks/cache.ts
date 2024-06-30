import Cache from "#kernel/cache"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the Cache class.
 * @param cacheBenchmarkInputSize The size of the input for the cache benchmark.
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeCacheBenchmark(cacheBenchmarkInputSize: number, benchmarkDuration: number) {
    const oneUint8Array = new Uint8Array(1)
    oneUint8Array[0] = 0xff
    const randomUint8Array = new Uint8Array(cacheBenchmarkInputSize)
    for (let i = 0; i < cacheBenchmarkInputSize; i++) randomUint8Array[i] = Math.floor(Math.random() * 0xff)

    const oneUint16Array = new Uint16Array(1)
    oneUint16Array[0] = 0xffff
    const randomUint16Array: Uint16Array = new Uint16Array(cacheBenchmarkInputSize / 2)
    for (let i = 0; i < cacheBenchmarkInputSize / 2; i++) randomUint16Array[i] = Math.floor(Math.random() * 0xffff)

    const oneUint32Array = new Uint32Array(1)
    oneUint32Array[0] = 0xffffffff
    const randomUint32Array: Uint32Array = new Uint32Array(cacheBenchmarkInputSize / 4)
    for (let i = 0; i < cacheBenchmarkInputSize / 4; i++) randomUint32Array[i] = Math.floor(Math.random() * 0xffffffff)

    const oneHex = "A".repeat(2)
    const randomHex = "A".repeat(cacheBenchmarkInputSize * 2)

    const oneUtf8 = "A"
    const randomUtf8 = "A".repeat(cacheBenchmarkInputSize)

    const oneBigInt = BigInt(0x1)
    const randomBigInt = BigInt(`0x${randomHex}`)

    externalLogger.info("Starting benchmarking for the cache library...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(`>> Cache benchmark input size: ${cacheBenchmarkInputSize.toLocaleString("en-US")}`)

    console.log("")
    externalLogger.warn("This might take a while depending on the benchmark duration and the input size you chose.")
    externalLogger.warn("Please be patient and wait for the results to be displayed.")

    // Test cache instance
    const cache = Cache.alloc(cacheBenchmarkInputSize)
    const cacheX8 = Cache.alloc(cacheBenchmarkInputSize * 8)
    const emptyCache = Cache.alloc(cacheBenchmarkInputSize)

    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => cache.check(0, 1), "check")
    bench.print("general")

    bench.benchmark(() => Cache.alloc(64), "alloc")
    bench.benchmark(() => Cache.fromHexString(randomHex), "fromHexString")
    bench.benchmark(() => Cache.fromUtf8String(randomUtf8), "fromUtf8String")
    bench.benchmark(() => Cache.fromUint8Array(oneUint8Array), "fromUint8Array")
    bench.benchmark(() => Cache.fromUint16Array(oneUint16Array), "fromUint16Array")
    bench.benchmark(() => Cache.fromUint32Array(oneUint32Array), "fromUint32Array")
    bench.print("static")

    bench.benchmark(() => Cache.fromUint8Array(randomUint8Array), `fromUint8Array(${randomUint8Array.length})`)
    bench.benchmark(() => Cache.fromUint16Array(randomUint16Array), `fromUint16Array(${randomUint16Array.length})`)
    bench.benchmark(() => Cache.fromUint32Array(randomUint32Array), `fromUint32Array(${randomUint32Array.length})`)
    bench.print("static (multiple)")

    bench.benchmark(() => cache.writeHexString(oneHex), `writeHexString(1)`)
    bench.benchmark(() => cache.writeUtf8String(oneUtf8), `writeUtf8String(1)`)
    bench.benchmark(() => cache.writeUint8(0xff), `writeUint8(1)`)
    bench.benchmark(() => cache.writeUint16(0xffff), `writeUint16(1)`)
    bench.benchmark(() => cache.writeUint32(0xffffffff), `writeUint32(1)`)
    bench.benchmark(() => cache.writeUint8Array(oneUint8Array), `writeUint8Array(1)`)
    bench.benchmark(() => cache.writeUint16Array(oneUint16Array), `writeUint16Array(1)`)
    bench.benchmark(() => cache.writeUint32Array(oneUint32Array), `writeUint32Array(1)`)
    bench.benchmark(() => cache.writeBigInt(oneBigInt), `writeBigInt(1)`)
    bench.print("write")

    bench.benchmark(() => cache.writeHexString(randomHex), `writeHexString(${randomHex.length})`)
    bench.benchmark(() => cache.writeUtf8String(randomUtf8), `writeUtf8String(${randomUtf8.length})`)
    bench.benchmark(() => cache.writeUint8Array(randomUint8Array), `writeUint8Array(${randomUint8Array.length})`)
    bench.benchmark(() => cache.writeUint16Array(randomUint16Array), `writeUint16Array(${randomUint16Array.length})`)
    bench.benchmark(() => cache.writeUint32Array(randomUint32Array), `writeUint32Array(${randomUint32Array.length})`)
    bench.benchmark(() => cache.writeBigInt(randomBigInt), `writeBigInt(${randomBigInt.toString().length})`)
    bench.print("write (multiple)")

    bench.benchmark(() => cache.readHexString(0, 1), "readHexString(1)")
    bench.benchmark(() => cache.readUtf8String(0, 1), "readUtf8String(1)")
    bench.benchmark(() => cache.readUint8(0), "readUint8")
    bench.benchmark(() => cache.readUint16(0), "readUint16")
    bench.benchmark(() => cache.readUint32(0), "readUint32")
    bench.benchmark(() => cache.readBigInt(0, 1), "readBigInt(1)")
    bench.print("read")

    bench.benchmark(() => cache.readHexString(0, cacheBenchmarkInputSize), `readHexString(${randomHex.length})`)
    bench.benchmark(() => cache.readUtf8String(0, cacheBenchmarkInputSize), `readUtf8String(${randomUtf8.length})`)
    bench.benchmark(() => cache.readBigInt(0, cacheBenchmarkInputSize), `readBigInt(${randomBigInt.toString().length})`)
    bench.print("read (multiple)")

    bench.benchmark(() => cache.toHexString(), "toHexString")
    bench.benchmark(() => cache.toUtf8String(), "toUtf8String")
    bench.benchmark(() => cache.toString("hex"), "toString(hex)")
    bench.benchmark(() => cache.toUint8Array(), "toUint8Array")
    bench.benchmark(() => cache.toUint16Array(), "toUint16Array")
    bench.benchmark(() => cache.toUint32Array(), "toUint32Array")
    bench.print("convert")

    const firstCache = Cache.alloc(cacheBenchmarkInputSize)
    const secondCache = Cache.alloc(cacheBenchmarkInputSize)
    bench.benchmark(() => firstCache.equals(secondCache), "equals(true)")
    firstCache.writeHexString(randomHex)
    secondCache.writeHexString(randomHex.split("").reverse().join(""))
    bench.benchmark(() => firstCache.equals(secondCache), "equals(false)")
    bench.benchmark(() => cache.isEmpty(), "isEmpty(0)")
    bench.benchmark(() => emptyCache.isEmpty(), `isEmpty(${cacheBenchmarkInputSize})`)
    bench.print("check")

    bench.benchmark(() => cache.randomFill(), `randomFill(${cacheBenchmarkInputSize})`)
    bench.benchmark(() => cacheX8.randomFill(), `randomFill(${cacheBenchmarkInputSize * 8})`)
    bench.benchmark(() => cache.safeRandomFill(), `safeRandomFill(${cacheBenchmarkInputSize})`)
    bench.benchmark(() => cacheX8.safeRandomFill(), `safeRandomFill(${cacheBenchmarkInputSize * 8})`)
    bench.print("random")

    bench.benchmark(() => cache.copy(0, cacheBenchmarkInputSize), "copy")
    bench.benchmark(() => cache.subarray(0, cacheBenchmarkInputSize), "subarray")
    bench.benchmark(() => cache.swap(0, cacheBenchmarkInputSize), "swap")
    bench.benchmark(() => cache.partialReverse(0, cacheBenchmarkInputSize / 2), "partialReverse")
    bench.benchmark(() => cache.reverse(), "reverse")
    bench.benchmark(() => cache.rotateLeft(), "rotateLeft")
    bench.benchmark(() => cache.rotateRight(), "rotateRight")
    bench.benchmark(() => cache.shiftLeft(), "shiftLeft")
    bench.benchmark(() => cache.shiftRight(), "shiftRight")
    bench.benchmark(() => cache.fill(0xff), "fill")
    bench.benchmark(() => cache.clear(), "clear")
    bench.print("utility")
}