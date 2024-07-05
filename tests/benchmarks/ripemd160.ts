import Ripemd160Algorithm from "#kernel/algorithms/ripemd160"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"
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

    // Test values
    const hexInput = "cc32441a8b9ade1b88ad5ec47787906bd6975636"
    const inputSlot: MemorySlot = { start: 0, length: 20, end: 20 }
    const outputSlot: MemorySlot = { start: 20, length: 20, end: 40 }

    const randomHexInput = "A".repeat(benchmarkInputSize * 2)
    const randomHexInputSlot: MemorySlot = { start: 0, length: benchmarkInputSize, end: benchmarkInputSize }
    const randomHexOutputSlot: MemorySlot = {
        start: benchmarkInputSize,
        length: benchmarkInputSize,
        end: benchmarkInputSize * 2,
    }

    // Test cache instances
    const cache = new Cache(256)

    // Test Ripemd160Algorithm instance
    const ripemd160Algorithm = new Ripemd160Algorithm()

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    cache.writeHexString(hexInput)
    bench.benchmark(() => ripemd160Algorithm.execute(cache, inputSlot, outputSlot), "execute(20)")

    cache.writeHexString(randomHexInput)
    bench.benchmark(
        () => ripemd160Algorithm.execute(cache, randomHexInputSlot, randomHexOutputSlot),
        `execute(${benchmarkInputSize})`
    )

    bench.print()
}
