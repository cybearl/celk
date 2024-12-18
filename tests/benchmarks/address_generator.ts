import AddressGenerator from "#kernel/generators/address_generator"
import { InstructionSetName } from "#kernel/utils/instructions"
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
    const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33")

    // Benchmark
    const bench = new Bench(benchmarkDuration)

    const memoryInstructionSetNames: InstructionSetName[] = [
        "MEMORY_SLOT::BTC33",
        "MEMORY_SLOT::BTC65",
        "MEMORY_SLOT::BTC33::P2SH",
        "MEMORY_SLOT::BTC65::P2SH",
        "MEMORY_SLOT::BTC33::P2WPKH", // = "MEMORY_SLOT::BTC33"
        "MEMORY_SLOT::BTC65::P2WPKH", // = "MEMORY_SLOT::BTC65"
        "MEMORY_SLOT::BTC33::P2WSH",
        "MEMORY_SLOT::BTC65::P2WSH",
        "MEMORY_SLOT::EVM64",
    ]

    const instructionSetNames: InstructionSetName[] = [
        "BTC33::P2PKH",
        "BTC65::P2PKH",
        "BTC33::P2SH",
        "BTC65::P2SH",
        "BTC33::P2WPKH",
        "BTC65::P2WPKH",
        "BTC33::P2WSH",
        "BTC65::P2WSH",
        "EVM64",
    ]

    for (const memoryInstructionSetName of memoryInstructionSetNames) {
        addressGenerator.setInstructionSet(memoryInstructionSetName)

        let name: string
        switch (memoryInstructionSetName) {
            case "MEMORY_SLOT::BTC33":
                name = "MEMORY_SLOT::BTC33 / MEMORY_SLOT::BTC33::P2WPKH"
                break
            case "MEMORY_SLOT::BTC65":
                name = "MEMORY_SLOT::BTC65 / MEMORY_SLOT::BTC65::P2WPKH"
                break
            case "MEMORY_SLOT::BTC33::P2WPKH":
                // Skip this one, as it is already covered by "MEMORY_SLOT::BTC33"
                continue
            case "MEMORY_SLOT::BTC65::P2WPKH":
                // Skip this one, as it is already covered by "MEMORY_SLOT::BTC65"
                continue
            default:
                name = memoryInstructionSetName
                break
        }

        bench.benchmark(() => addressGenerator.executeInstructions(), `[${name}]`)
    }

    bench.print("Into memory")

    for (const instructionSetName of instructionSetNames) {
        addressGenerator.setInstructionSet(instructionSetName)
        bench.benchmark(() => addressGenerator.executeInstructions(), `[${instructionSetName}]`)
    }

    bench.print("Into address")
}
