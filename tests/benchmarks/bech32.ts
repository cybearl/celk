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
    externalLogger.info("Starting benchmarking of the Bech32Encoder...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused (Bech32Encoder is not input-size dependent)")

    console.log("")
    externalLogger.warn("This might take a while depending on the benchmark duration you chose.")
    externalLogger.warn("Please be patient and wait for the results to appear.")

    // Test values
    const bech32InputHex = "751e76e8199196d454941c45d1b3a323f1433bd6"
    const bech32OutputHex = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"

    const bech32mInputHex = "46ed879f455ec641153155bc6a5c36af21256bf66d637b9183d1fedd76a8"
    const bech32mOutputHex = "bc1gmkc0869tmryz9f32k7x5hpk4usj26lkd43hhyvr68ld6a4gqhsalc"

    // Test cache instances
    const bech32InputCache = Cache.fromHexString(bech32InputHex)
    const bech32OutputCache = new Cache(bech32InputHex.length / 2)
    const bech32mInputCache = Cache.fromHexString(bech32mInputHex)
    const bech32mOutputCache = new Cache(bech32mInputHex.length / 2)

    // Test Bech32Encoder instances
    const bech32Encoder = new Bech32Encoder("bech32")
    const bech32mEncoder = new Bech32Encoder("bech32m")

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => bech32Encoder.encode("bc", 0, bech32InputCache), "encode")
    bench.benchmark(() => bech32Encoder.decode(bech32OutputHex, bech32OutputCache), "decode")
    bench.print("bech32")

    bench.benchmark(() => bech32mEncoder.encode("bc", 0, bech32mInputCache), "encode")
    bench.benchmark(() => bech32mEncoder.decode(bech32mOutputHex, bech32mOutputCache), "decode")
    bench.print("bech32m")
}
