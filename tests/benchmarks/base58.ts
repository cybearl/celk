import Cache from "#kernel/utils/cache"
import Base58Encoder from "#kernel/encoders/base58"
import Bench from "#lib/utils/bench"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Base58Encoder` class.
 * @param _ Placeholder for the benchmark input size (unused here).
 * @param benchmarkDuration The duration of the benchmark in milliseconds.
 */
export default function executeBase58EncoderBenchmark(_: any, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the Base58 encoder...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused ('Base58Encoder' is not input-size dependent)")

    // Test values
    const base58InputUtf8 = "128739950dcdd98e5e"
    const base58OutputUtf8 = "33MH7LyrfQM1c1N4rHNLLFWfv"

    const base58InputAddress = "0x00B33370C37DD76D5723354122B8AC7F58D95450D154AF8401"
    const base58OutputAddress = "1HLXaV8k8JsT9gAzKJm4zKau5PcYSqpkpQ"

    // Test cache instances
    const base58InputUtf8Cache = Cache.fromUtf8String(base58InputUtf8)
    const base58InputAddressCache = Cache.fromHexString(base58InputAddress)
    const base58OutputCache = new Cache(256)

    // Test Base58Encoder instances
    const base58Encoder = new Base58Encoder()

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => base58Encoder.encode(base58InputUtf8Cache), `encode(${base58InputUtf8.length})`)
    bench.benchmark(
        () => base58Encoder.decode(base58OutputUtf8, base58OutputCache, { start: 0, length: 25, end: 25 }),
        `decode(${base58OutputUtf8.length})`
    )
    bench.benchmark(
        () => base58Encoder.encode(base58InputAddressCache),
        `encode(${base58InputAddress.length / 2} - address)`
    )
    bench.benchmark(
        () => base58Encoder.decode(base58OutputAddress, base58OutputCache, { start: 0, length: 34, end: 34 }),
        `decode(${base58OutputAddress.length} - address)`
    )
    bench.print("base58")
}
