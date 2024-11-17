import Keccak256Algorithm from "#kernel/algorithms/keccak256"
import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Keccak256Algorithm` class.
 * @param benchmarkInputSize The size of the input for the benchmark.
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeKeccak256AlgorithmBenchmark(benchmarkInputSize: number, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the Keccak256 algorithm...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(`>> Benchmark input size: ${benchmarkInputSize.toLocaleString("en-US")}`)

    const keccak256 = new Keccak256Algorithm()

    // Test values
    const oneUint8Array = new Uint8Array(1)
    oneUint8Array[0] = 0xff
    const randomUint8Array = new Uint8Array(benchmarkInputSize)
    for (let i = 0; i < benchmarkInputSize; i++) randomUint8Array[i] = Math.floor(Math.random() * 0xff)

    // Test cache instances
    const cacheX1 = Cache.alloc(1 + 32)
    const X1InputSlot: MemorySlot = { start: 0, length: 1, end: 1 }
    const X1OutputSlot: MemorySlot = { start: 1, length: 32, end: 33 }
    cacheX1.writeUint8Array(oneUint8Array, X1InputSlot.start)

    const cache = new Cache(benchmarkInputSize + 32)
    const inputSlot: MemorySlot = { start: 0, length: benchmarkInputSize, end: benchmarkInputSize }
    const outputSlot: MemorySlot = { start: benchmarkInputSize, length: 32, end: benchmarkInputSize + 32 }
    cache.writeUint8Array(randomUint8Array, inputSlot.start)

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(
        () => keccak256.hash({ cache, ...inputSlot }, { cache, ...outputSlot }),
        `hash(${benchmarkInputSize})`
    )
    bench.benchmark(
        () => keccak256.hash({ cache: cacheX1, ...X1InputSlot }, { cache: cacheX1, ...X1OutputSlot }),
        `hash(1)`
    )
    bench.print()
}
