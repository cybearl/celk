import Cache from "#kernel/cache"
import Base58Encoder from "#kernel/encoders/base58"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Base58Encoder` class.
 * @param _ Placeholder for the benchmark input size (unused here).
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeBase58EncoderBenchmark(_: any, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the Base58 encoder...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused (Base58Encoder is not input-size dependent)")

    // Test values
    const base58InputUtf8 = "128739950dcdd98e5e"
    const base58Output = "33MH7LyrfQM1c1N4rHNLLFWfv"

    // Test cache instances
    const base58InputCache = Cache.fromUtf8String(base58InputUtf8)
    const base58OutputCache = new Cache(base58InputUtf8.length / 2 + 1)

    // Test Base58Encoder instances
    const base58Encoder = new Base58Encoder()

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => base58Encoder.encode(base58InputCache), `encode(${base58InputCache.length})`)
    bench.benchmark(() => base58Encoder.decode(base58Output, base58OutputCache), `decode(${base58OutputCache.length})`)
    bench.print("base58")
}
