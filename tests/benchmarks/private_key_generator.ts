import PrivateKeyGenerator, { PrivateKeyGeneratorOptions } from "#kernel/generators/private_key_generator"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Base58Encoder` class.
 * @param _ Placeholder for the benchmark input size (unused here).
 * @param benchmarkDuration The duration of the benchmark in milliseconds.
 */
export default function executePrivateKeyGeneratorBenchmark(benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the private key generator...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused (PrivateKeyGenerator is not input-size dependent)")

    // Test PrivateKeyGenerator instances
    const privateKeyGenerator = new PrivateKeyGenerator()

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    let options: PrivateKeyGeneratorOptions

    options = { privateKeySize: 1 }
    privateKeyGenerator.setOptions(options)
    bench.benchmark(() => privateKeyGenerator.generate(), `generate(${options.privateKeySize})`)

    options = { privateKeySize: 8 }
    privateKeyGenerator.setOptions(options)
    bench.benchmark(() => privateKeyGenerator.generate(), `generate(${options.privateKeySize})`)

    options = { privateKeySize: 32 }
    privateKeyGenerator.setOptions(options)
    bench.benchmark(() => privateKeyGenerator.generate(), `generate(${options.privateKeySize})`)

    options = { privateKeySize: 64 }
    privateKeyGenerator.setOptions(options)
    bench.benchmark(() => privateKeyGenerator.generate(), `generate(${options.privateKeySize})`)

    bench.print("private_key_generator")
}
