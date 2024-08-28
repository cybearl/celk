import Secp256k1Algorithm from "#kernel/algorithms/secp256k1"
import Cache from "#kernel/cache"
import { MemorySlot } from "#kernel/memory"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `Secp256k1Algorithm` class.
 * @param _ Placeholder for the benchmark input size (unused here, always 32 bytes).
 * @param benchmarkDuration The duration of the benchmark.
 */
export default function executeSecp256k1AlgorithmBenchmark(_: any, benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the SECP256K1 algorithm...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused (Secp256k1Algorithm is not input-size dependent)")

    const secp256k1 = new Secp256k1Algorithm()

    // Test values
    const randomUint8Array = new Uint8Array(32)
    for (let i = 0; i < 32; i++) randomUint8Array[i] = Math.floor(Math.random() * 0xff)

    // Test cache instances
    const cache = new Cache(32 + 65)
    const inputSlot: MemorySlot = { start: 0, length: 32, end: 32 }
    const outputSlot: MemorySlot = { start: 32, length: 65, end: 32 + 65 }
    cache.writeUint8Array(randomUint8Array, inputSlot.start)

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    bench.benchmark(() => secp256k1.generate("compressed", cache, inputSlot, outputSlot), "hash(c32)")
    bench.benchmark(() => secp256k1.generate("uncompressed", cache, inputSlot, outputSlot), "hash(u32)")

    bench.print()
}
