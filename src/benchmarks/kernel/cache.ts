import config from "configs/main.config";
import Cache from "lib/kernel/cache";
import type { BenchmarkResults } from "lib/utils/benchmark";
import benchmark, { printBenchmarkResults } from "lib/utils/benchmark";
import logger from "lib/utils/logger";


const oneUint8Array = new Uint8Array(1);
oneUint8Array[0] = 0xFF;
const randomUint8Array = new Uint8Array(config.cacheBenchmarkInputSize);
for (let i = 0; i < config.cacheBenchmarkInputSize; i++) randomUint8Array[i] = Math.floor(Math.random() * 0xFF);

const oneUint16Array = new Uint16Array(1);
oneUint16Array[0] = 0xFFFF;
const randomUint16Array: Uint16Array = new Uint16Array(config.cacheBenchmarkInputSize / 2);
for (let i = 0; i < (config.cacheBenchmarkInputSize / 2); i++) randomUint16Array[i] = Math.floor(Math.random() * 0xFFFF);

const oneUint32Array = new Uint32Array(1);
oneUint32Array[0] = 0xFFFFFFFF;
const randomUint32Array: Uint32Array = new Uint32Array(config.cacheBenchmarkInputSize / 4);
for (let i = 0; i < (config.cacheBenchmarkInputSize / 4); i++) randomUint32Array[i] = Math.floor(Math.random() * 0xFFFFFFFF);

const oneHex = "A".repeat(2);
const randomHex = "A".repeat(config.cacheBenchmarkInputSize * 2);

const oneUtf8 = "A";
const randomUtf8 = "A".repeat(config.cacheBenchmarkInputSize);

const oneBigInt = BigInt(0x1);
const randomBigInt = BigInt(`0x${randomHex}`);


/**
 * Main function for the cache benchmark.
 */
export default function executeCacheBenchmark() {
    logger.info("Starting benchmarking for the cache library...");
    logger.info(`>> Benchmark duration: ${config.benchmarkDuration} millisecond(s)`);
    logger.info(`>> Cache benchmark input size: ${config.cacheBenchmarkInputSize.toLocaleString("en-US")}`);

    console.log("");
    logger.warn("This might take a while depending on the benchmark duration and the input size you chose.");
    logger.warn("Please be patient and wait for the results to be displayed.");

    // Test cache instance
    const cache = Cache.alloc(config.cacheBenchmarkInputSize);
    const cacheX8 = Cache.alloc(config.cacheBenchmarkInputSize * 8);
    const emptyCache = Cache.alloc(config.cacheBenchmarkInputSize);

    let results: BenchmarkResults = {};

    // General methods
    results = {};
    results["check"] = benchmark(() => cache.check(0, 1));
    printBenchmarkResults("general", results);

    // Static methods
    results = {};
    results.alloc = benchmark(() => Cache.alloc(64));
    results["fromHexString(1)"] = benchmark(() => Cache.fromHexString(randomHex));
    results["fromUtf8String(1)"] = benchmark(() => Cache.fromUtf8String(randomUtf8));
    results["fromUint8Array(1)"] = benchmark(() => Cache.fromUint8Array(oneUint8Array));
    results["fromUint16Array(1)"] = benchmark(() => Cache.fromUint16Array(oneUint16Array));
    results["fromUint32Array(1)"] = benchmark(() => Cache.fromUint32Array(oneUint32Array));
    printBenchmarkResults("static", results);

    // Static (multiple) methods
    results = {};
    results[`fromUint8Array(${randomUint8Array.length})`] = benchmark(() => Cache.fromUint8Array(randomUint8Array));
    results[`fromUint16Array(${randomUint16Array.length})`] = benchmark(() => Cache.fromUint16Array(randomUint16Array));
    results[`fromUint32Array(${randomUint32Array.length})`] = benchmark(() => Cache.fromUint32Array(randomUint32Array));
    printBenchmarkResults("static (multiple)", results);

    // Write methods
    results = {};
    results["writeHexString(1)"] = benchmark(() => cache.writeHexString(oneHex));
    results["writeUtf8String(1)"] = benchmark(() => cache.writeUtf8String(oneUtf8));
    results.writeUint8 = benchmark(() => cache.writeUint8(0xFF));
    results.writeUint16 = benchmark(() => cache.writeUint16(0xFFFF));
    results.writeUint32 = benchmark(() => cache.writeUint32(0xFFFFFFFF));
    results["writeUint8Array(1)"] = benchmark(() => cache.writeUint8Array(oneUint8Array));
    results["writeUint16Array(1)"] = benchmark(() => cache.writeUint16Array(oneUint16Array));
    results["writeUint32Array(1)"] = benchmark(() => cache.writeUint32Array(oneUint32Array));
    results[`writeBigInt(${oneBigInt.toString().length})`] = benchmark(() => cache.writeBigInt(oneBigInt));
    printBenchmarkResults("write", results);

    // Write (multiple) methods
    results = {};
    results[`writeHexString(${randomHex.length})`] = benchmark(() => cache.writeHexString(randomHex));
    results[`writeUtf8String(${randomUtf8.length})`] = benchmark(() => cache.writeUtf8String(randomUtf8));
    results[`writeUint8Array(${randomUint8Array.length})`] = benchmark(() => cache.writeUint8Array(randomUint8Array));
    results[`writeUint16Array(${randomUint16Array.length})`] = benchmark(() => cache.writeUint16Array(randomUint16Array));
    results[`writeUint32Array(${randomUint32Array.length})`] = benchmark(() => cache.writeUint32Array(randomUint32Array));
    results[`writeBigInt(${randomBigInt.toString().length})`] = benchmark(() => cache.writeBigInt(randomBigInt));
    printBenchmarkResults("write (multiple)", results);

    // Read methods
    results = {};
    results["readHexString(1)"] = benchmark(() => cache.readHexString(0, 1));
    results["readUtf8String(1)"] = benchmark(() => cache.readUtf8String(0, 1));
    results.readUint8 = benchmark(() => cache.readUint8(0));
    results.readUint16 = benchmark(() => cache.readUint16(0));
    results.readUint32 = benchmark(() => cache.readUint32(0));
    results["readBigInt(1)"] = benchmark(() => cache.readBigInt(0, 1));
    printBenchmarkResults("read", results);

    // Read (multiple) methods
    results = {};
    results[`readHexString(${randomHex.length})`] = benchmark(() => cache.readHexString(0, config.cacheBenchmarkInputSize));
    results[`readUtf8String(${randomUtf8.length})`] = benchmark(() => cache.readUtf8String(0, config.cacheBenchmarkInputSize));
    results[`readBigInt(${randomBigInt.toString().length})`] = benchmark(() => cache.readBigInt(0, config.cacheBenchmarkInputSize));
    printBenchmarkResults("read (multiple)", results);

    // Conversion methods
    results = {};
    results.toHexString = benchmark(() => cache.toHexString());
    results.toUtf8String = benchmark(() => cache.toUtf8String());
    results["toString"] = benchmark(() => cache.toString("hex"));
    results.toUint8Array = benchmark(() => cache.toUint8Array());
    results.toUint16Array = benchmark(() => cache.toUint16Array());
    results.toUint32Array = benchmark(() => cache.toUint32Array());
    printBenchmarkResults("conversion", results);

    // Check methods
    results = {};
    const firstCache = Cache.alloc(config.cacheBenchmarkInputSize);
    const secondCache = Cache.alloc(config.cacheBenchmarkInputSize);
    results["equals(true)"] = benchmark(() => firstCache.equals(secondCache));

    firstCache.writeHexString(randomHex);
    secondCache.writeHexString(randomHex.split("").reverse().join(""));
    results["equals(false)"] = benchmark(() => firstCache.equals(secondCache));

    results["isEmpty(0)"] = benchmark(() => cache.isEmpty());
    results[`isEmpty(${config.cacheBenchmarkInputSize})`] = benchmark(() => emptyCache.isEmpty());
    printBenchmarkResults("check", results);

    // Randomness methods
    results = {};
    results[`randomFill(${config.cacheBenchmarkInputSize})`] = benchmark(() => cache.randomFill());
    results[`randomFill(${config.cacheBenchmarkInputSize * 8})`] = benchmark(() => cacheX8.randomFill());
    results[`safeRandomFill(${config.cacheBenchmarkInputSize})`] = benchmark(() => cache.safeRandomFill());
    results[`safeRandomFill(${config.cacheBenchmarkInputSize * 8})`] = benchmark(() => cacheX8.safeRandomFill());
    printBenchmarkResults("randomness", results);

    // Utility methods
    results = {};
    results.copy = benchmark(() => cache.copy(0, config.cacheBenchmarkInputSize));
    results.subarray = benchmark(() => cache.subarray(0, config.cacheBenchmarkInputSize));
    results.swap = benchmark(() => cache.swap(0, config.cacheBenchmarkInputSize));
    results.reversePart = benchmark(() => cache.partialReverse(0, config.cacheBenchmarkInputSize / 2));
    results.reverse = benchmark(() => cache.reverse());
    results.rotateLeft = benchmark(() => cache.rotateLeft());
    results.rotateRight = benchmark(() => cache.rotateRight());
    results.shiftLeft = benchmark(() => cache.shiftLeft());
    results.shiftRight = benchmark(() => cache.shiftRight());
    results.fill = benchmark(() => cache.fill(0xFF));
    results.clear = benchmark(() => cache.clear());
    printBenchmarkResults("utility", results);
}