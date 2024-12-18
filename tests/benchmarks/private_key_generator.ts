import PrivateKeyGenerator from "#kernel/generators/private_key_generator"
import Cache from "#kernel/utils/cache"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `PrivateKeyGenerator` class.
 * @param _ Placeholder for the benchmark input size (unused here).
 * @param benchmarkDuration The duration of the benchmark in milliseconds.
 */
export default function executePrivateKeyGeneratorBenchmark(_: any, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the private key generator...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused ('PrivateKeyGenerator' is not input-size dependent)")

    // Test cache instances
    let cache: Cache = Cache.alloc(1)

    // Test PrivateKeyGenerator instances
    const privateKeyGenerator = new PrivateKeyGenerator({ cache })

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    cache = Cache.alloc(1)
    privateKeyGenerator.setCacheInstanceWithSlot({ cache })
    privateKeyGenerator.setOptions({ upperBound: 2n ** 8n - 1n })
    bench.benchmark(
        () => privateKeyGenerator.generate(),
        `generate(${privateKeyGenerator.info.minByteSize} - ${privateKeyGenerator.info.maxByteSize})`
    )

    cache = Cache.alloc(2)
    privateKeyGenerator.setCacheInstanceWithSlot({ cache })
    privateKeyGenerator.setOptions({ upperBound: 2n ** 16n - 1n })
    bench.benchmark(
        () => privateKeyGenerator.generate(),
        `generate(${privateKeyGenerator.info.minByteSize} - ${privateKeyGenerator.info.maxByteSize})`
    )

    cache = Cache.alloc(4)
    privateKeyGenerator.setCacheInstanceWithSlot({ cache })
    privateKeyGenerator.setOptions({ upperBound: 2n ** 32n - 1n })
    bench.benchmark(
        () => privateKeyGenerator.generate(),
        `generate(${privateKeyGenerator.info.minByteSize} - ${privateKeyGenerator.info.maxByteSize})`
    )

    cache = Cache.alloc(8)
    privateKeyGenerator.setCacheInstanceWithSlot({ cache })
    privateKeyGenerator.setOptions({ upperBound: 2n ** 64n - 1n })
    bench.benchmark(
        () => privateKeyGenerator.generate(),
        `generate(${privateKeyGenerator.info.minByteSize} - ${privateKeyGenerator.info.maxByteSize})`
    )

    cache = Cache.alloc(16)
    privateKeyGenerator.setCacheInstanceWithSlot({ cache })
    privateKeyGenerator.setOptions({ upperBound: 2n ** 128n - 1n })
    bench.benchmark(
        () => privateKeyGenerator.generate(),
        `generate(${privateKeyGenerator.info.minByteSize} - ${privateKeyGenerator.info.maxByteSize})`
    )

    cache = Cache.alloc(32)
    privateKeyGenerator.setCacheInstanceWithSlot({ cache })
    privateKeyGenerator.setOptions({ upperBound: 2n ** 256n - 1n })
    bench.benchmark(
        () => privateKeyGenerator.generate(),
        `generate(${privateKeyGenerator.info.minByteSize} - ${privateKeyGenerator.info.maxByteSize})`
    )

    cache = Cache.alloc(64)
    privateKeyGenerator.setCacheInstanceWithSlot({ cache })
    privateKeyGenerator.setOptions({ upperBound: 2n ** 512n - 1n })
    bench.benchmark(
        () => privateKeyGenerator.generate(),
        `generate(${privateKeyGenerator.info.minByteSize} - ${privateKeyGenerator.info.maxByteSize})`
    )

    bench.print("private_key_generator")
}
