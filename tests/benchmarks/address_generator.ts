import AddressGenerator from "#kernel/generators/address_generator"
import { InstructionSet, addressInstructionSets, memoryInstructionSets } from "#kernel/utils/instructions"
import Bench from "#lib/utils/benchmark"
import externalLogger from "#lib/utils/external_logger"

/**
 * The benchmark for the `AddressGenerator` class.
 * @param _ Placeholder for the benchmark input size (unused here).
 * @param benchmarkDuration The duration of the benchmark in milliseconds.
 */
export default function executeAddressGeneratorBenchmark(benchmarkDuration: number) {
    externalLogger.info("Starting benchmarking of the address generator...")
    externalLogger.info(`>> Benchmark duration: ${benchmarkDuration} millisecond(s)`)
    externalLogger.info(">> Benchmark input size: unused ('AddressGenerator' is not input-size dependent)")

    // Test AddressGenerator instances
    const addressGenerator = new AddressGenerator(InstructionSet.MEMORY_SLOT_BTC33_P2PKH)

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    for (const memoryInstructionSet of memoryInstructionSets) {
        addressGenerator.applyInstructionSet(memoryInstructionSet)

        let name: string
        switch (memoryInstructionSet) {
            case InstructionSet.MEMORY_SLOT_BTC33_P2PKH:
                name = "MEMORY_SLOT::BTC33::P2PKH / MEMORY_SLOT::BTC33::P2WPKH"
                break

            case InstructionSet.MEMORY_SLOT_BTC65_P2PKH:
                name = "MEMORY_SLOT::BTC65::P2PKH / MEMORY_SLOT::BTC65::P2WPKH"
                break

            case InstructionSet.MEMORY_SLOT_BTC33_P2WPKH:
                // Skip this one, as it is already covered by "MEMORY_SLOT::BTC33::P2PKH"
                continue

            case InstructionSet.MEMORY_SLOT_BTC65_P2WPKH:
                // Skip this one, as it is already covered by "MEMORY_SLOT::BTC65::P2PKH"
                continue
            default:
                name = memoryInstructionSet
                break
        }

        bench.benchmark(() => addressGenerator.executeInstructions(), `[${name}]`)
    }

    bench.print("Into memory")

    for (const addressInstructionSet of addressInstructionSets) {
        addressGenerator.applyInstructionSet(addressInstructionSet)
        bench.benchmark(() => addressGenerator.executeInstructions(), `[${addressInstructionSet}]`)
    }

    bench.print("Into address")
}
