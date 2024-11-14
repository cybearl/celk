import Cache from "#kernel/cache"
import Bech32Encoder from "#kernel/encoders/bech32"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Bech32Encoder` class.
 * @param _ Placeholder for the benchmark input size (unused here).
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeBech32EncoderBenchmark(_: any, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the Bech32 encoder...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused (Bech32Encoder is not input-size dependent)")

    // Test values
    const bech32InputHex = "128739950dcdd98e5c01a056a19a3b2a9c77b9b7"
    const bech32Output = "bc1qz2rnn9gdehvcuhqp5pt2rx3m92w80wdhzp9xlg"

    const bech32mInputHex = "128739950dcdd98e5c01a056a19a3b2a9c77b9b7"
    const bech32mOutput = "bc1gz2rnn9gdehvcuhqp5pt2rx3m92w80wdhamfqfq"

    // Test cache instances
    const bech32InputCache = Cache.fromHexString(bech32InputHex)
    const bech32OutputCache = new Cache(bech32InputHex.length / 2)
    const bech32mInputCache = Cache.fromHexString(bech32mInputHex)
    const bech32mOutputCache = new Cache(bech32mInputHex.length / 2)

    // Test Bech32Encoder instances
    const bech32Encoder = new Bech32Encoder()

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => bech32Encoder.encode(0, "bc", bech32InputCache), `encode(${bech32InputCache.length})`)
    bench.benchmark(() => bech32Encoder.decode(bech32Output, bech32OutputCache), `decode(${bech32OutputCache.length})`)
    bench.print("bech32")

    bench.benchmark(() => bech32Encoder.encode(8, "bc", bech32mInputCache), `encode(${bech32mInputCache.length})`)
    bench.benchmark(
        () => bech32Encoder.decode(bech32mOutput, bech32mOutputCache),
        `decode(${bech32mOutputCache.length})`
    )
    bench.print("bech32m")
}
