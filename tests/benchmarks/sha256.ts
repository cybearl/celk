import Sha256Algorithm from "#kernel/algorithms/sha256"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/table"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `SHA256Algorithm` class.
 * @param benchmarkInputSize The size of the input for the benchmark.
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeSha256AlgorithmBenchmark(benchmarkInputSize: number, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the SHA256Algorithm...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(`>> Benchmark input size: ${benchmarkInputSize.toLocaleString("en-US")}`)

    console.log("")
    externalLogger.warn("This might take a while depending on the benchmark duration you chose.")
    externalLogger.warn("Please be patient and wait for the results to appear.")

    // Test values
    const hexInput = "dd6d953fb934989bdbe64be4ba4fe4ed4e8275ce399ab72ded842316edb012ec"
    const inputSlot: MemorySlot = { start: 0, length: 32, end: 32 }
    const outputSlot: MemorySlot = { start: 32, length: 32, end: 64 }

    const randomHexInput = "A".repeat(benchmarkInputSize * 2)
    const randomHexInputSlot: MemorySlot = { start: 0, length: benchmarkInputSize, end: benchmarkInputSize }
    const randomHexOutputSlot: MemorySlot = {
        start: benchmarkInputSize,
        length: benchmarkInputSize,
        end: benchmarkInputSize * 2,
    }

    // Test cache instances
    const cache = new Cache(256)

    // Test Sha256Algorithm instance
    const sha256Algorithm = new Sha256Algorithm()

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    cache.writeHexString(hexInput)
    bench.benchmark(() => sha256Algorithm.execute(cache, inputSlot, outputSlot), "execute(32)")

    cache.writeHexString(randomHexInput)
    bench.benchmark(
        () => sha256Algorithm.execute(cache, randomHexInputSlot, randomHexOutputSlot),
        `execute(${benchmarkInputSize})`
    )

    bench.print()
}
