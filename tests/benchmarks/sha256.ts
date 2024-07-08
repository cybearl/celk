import Sha256Algorithm from "#kernel/algorithms/sha256"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Sha256Algorithm` class.
 * @param benchmarkInputSize The size of the input for the benchmark.
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeSha256AlgorithmBenchmark(benchmarkInputSize: number, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the SHA-256 algorithm...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(`>> Benchmark input size: ${benchmarkInputSize.toLocaleString("en-US")}`)

    const sha256 = new Sha256Algorithm()

    // Test values
    const randomUint8Array = new Uint8Array(benchmarkInputSize)
    for (let i = 0; i < benchmarkInputSize; i++) randomUint8Array[i] = Math.floor(Math.random() * 0xff)

    // Test cache instances
    const cache4Bytes = new Cache(4 + 32)
    const inputSlot4Bytes: MemorySlot = { start: 0, length: 4, end: 4 }
    const outputSlot4Bytes: MemorySlot = { start: 4, length: 32, end: 36 }
    cache4Bytes.writeUint8Array(randomUint8Array.slice(0, 4), inputSlot4Bytes.start)

    const cache32Bytes = new Cache(32 + 32)
    const inputSlot32Bytes: MemorySlot = { start: 0, length: 32, end: 32 }
    const outputSlot32Bytes: MemorySlot = { start: 32, length: 32, end: 64 }
    cache32Bytes.writeUint8Array(randomUint8Array.slice(0, 32), inputSlot32Bytes.start)

    const cache = new Cache(benchmarkInputSize + 32)
    const inputSlot: MemorySlot = { start: 0, length: benchmarkInputSize, end: benchmarkInputSize }
    const outputSlot: MemorySlot = { start: benchmarkInputSize, length: 32, end: benchmarkInputSize + 32 }
    cache.writeUint8Array(randomUint8Array, inputSlot.start)

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => sha256.hash(cache4Bytes, inputSlot4Bytes, outputSlot4Bytes), `hash(4)`)
    bench.benchmark(() => sha256.hash(cache32Bytes, inputSlot32Bytes, outputSlot32Bytes), `hash(32)`)
    bench.benchmark(() => sha256.hash(cache, inputSlot, outputSlot), `hash(${benchmarkInputSize})`)
    bench.print()
}
