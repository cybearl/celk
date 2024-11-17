import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/utils/cache"
import { MemorySlot } from "#kernel/utils/instructions"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Ripemd160Algorithm` class.
 * @param benchmarkInputSize The size of the input for the benchmark.
 * @param benchmarkDuration The duration of the benchmark in milliseconds.
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
    const cache4Bytes = new Cache(4 + 20)
    const inputSlot4Bytes: MemorySlot = { start: 0, length: 4, end: 4 }
    const outputSlot4Bytes: MemorySlot = { start: 4, length: 20, end: 24 }
    cache4Bytes.writeUint8Array(randomUint8Array.slice(0, 4), inputSlot4Bytes.start)

    const cache20Bytes = new Cache(20 + 20)
    const inputSlot20Bytes: MemorySlot = { start: 0, length: 20, end: 20 }
    const outputSlot20Bytes: MemorySlot = { start: 20, length: 20, end: 40 }
    cache20Bytes.writeUint8Array(randomUint8Array.slice(0, 20), inputSlot20Bytes.start)

    const cache32Bytes = new Cache(32 + 20)
    const inputSlot32Bytes: MemorySlot = { start: 0, length: 32, end: 32 }
    const outputSlot32Bytes: MemorySlot = { start: 32, length: 20, end: 52 }
    cache32Bytes.writeUint8Array(randomUint8Array.slice(0, 32), inputSlot32Bytes.start)

    const cache = new Cache(benchmarkInputSize + 20)
    const inputSlot: MemorySlot = { start: 0, length: benchmarkInputSize, end: benchmarkInputSize }
    const outputSlot: MemorySlot = { start: benchmarkInputSize, length: 20, end: benchmarkInputSize + 20 }
    cache.writeUint8Array(randomUint8Array, inputSlot.start)

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(
        () => ripemd160.hash({ cache: cache4Bytes, ...inputSlot4Bytes }, { cache: cache4Bytes, ...outputSlot4Bytes }),
        `hash(4)`
    )
    bench.benchmark(
        () =>
            ripemd160.hash({ cache: cache20Bytes, ...inputSlot20Bytes }, { cache: cache20Bytes, ...outputSlot20Bytes }),
        `hash(20)`
    )
    bench.benchmark(
        () =>
            ripemd160.hash({ cache: cache32Bytes, ...inputSlot32Bytes }, { cache: cache32Bytes, ...outputSlot32Bytes }),
        `hash(32)`
    )
    bench.benchmark(
        () => ripemd160.hash({ cache, ...inputSlot }, { cache, ...outputSlot }),
        `hash(${benchmarkInputSize})`
    )
    bench.print()
}
