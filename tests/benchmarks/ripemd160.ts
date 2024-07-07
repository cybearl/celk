import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Ripemd160Algorithm` class.
 * @param benchmarkInputSize The size of the input for the benchmark.
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeRipemd160AlgorithmBenchmark(benchmarkInputSize: number, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the RIPEMD-160 algorithm...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(`>> Benchmark input size: ${benchmarkInputSize.toLocaleString("en-US")}`)

    const ripemd160 = new Ripemd160Algorithm()

    // Test values
    const randomUint8Array = new Uint8Array(benchmarkInputSize)
    for (let i = 0; i < benchmarkInputSize; i++) randomUint8Array[i] = Math.floor(Math.random() * 0xff)

    // Test cache instances
    const cache = new Cache(benchmarkInputSize + 20)
    const inputSlot: MemorySlot = { start: 0, length: benchmarkInputSize, end: benchmarkInputSize }
    const outputSlot: MemorySlot = { start: benchmarkInputSize, length: 20, end: benchmarkInputSize + 20 }
    cache.writeUint8Array(randomUint8Array, inputSlot.start)

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => Ripemd160Algorithm.hash(cache, inputSlot, outputSlot), `hash(${benchmarkInputSize})`)
    bench.benchmark(() => ripemd160.exec(cache, inputSlot, outputSlot), `exec(${benchmarkInputSize})`)
    bench.print()
}
