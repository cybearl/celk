import externalLogger from "#lib/utils/external_logger"
import executeBech32EncoderBenchmark from "#tests/benchmarks/bech32"
import executeCacheBenchmark from "#tests/benchmarks/cache"
import executeRipemd160AlgorithmBenchmark from "#tests/benchmarks/ripemd160"
import executeSha256AlgorithmBenchmark from "#tests/benchmarks/sha256"
import dedent from "dedent-js"
import minimist from "minimist"

/**
 * The help message.
 */
const helpMessage = dedent``

/**
 * The type definition for a benchmark function.
 */
type BenchmarkFunction = (cacheBenchmarkInputSize: number, benchmarkDuration: number) => void

/**
 * Benchmark routing.
 */
const benchmarks: { [key: string]: BenchmarkFunction } = {
    bech32: executeBech32EncoderBenchmark,
    cache: executeCacheBenchmark,
    ripemd160: executeRipemd160AlgorithmBenchmark,
    sha256: executeSha256AlgorithmBenchmark,
}

/**
 * Main function to route the benchmarks depending on the command line arguments.
 * @param args Arguments from the command line.
 */
function main(args: string[]) {
    externalLogger.info("Starting benchmarks, running outside of AdonisJS context.")

    const argv = minimist(args.slice(2))

    const argBenchmarkName = argv.benchmark || argv.b
    let argCacheBenchmarkInputSize = argv.cacheBenchmarkInputSize || argv.c
    let argBenchmarkDuration = argv.benchmarkDuration || argv.d

    if (!argCacheBenchmarkInputSize) {
        externalLogger.info(">> No cache benchmark input size provided, using default value of 128 bytes.")
        argCacheBenchmarkInputSize = 128
    }

    if (!argBenchmarkDuration) {
        externalLogger.info(">> No benchmark duration provided, using default value of 256 milliseconds.")
        argBenchmarkDuration = 256
    }

    console.log("")
    externalLogger.warn("This might take a while depending on the benchmark duration you chose.")
    externalLogger.warn("Please be patient and wait for the results to appear.")
    console.log("")

    if (!argBenchmarkName) {
        externalLogger.info(">> No benchmark name provided, running all benchmarks..")

        for (const benchmarkName in benchmarks) {
            console.log("")
            benchmarks[benchmarkName](argCacheBenchmarkInputSize, argBenchmarkDuration)
        }
    } else {
        if (benchmarks[argBenchmarkName]) {
            console.log("")
            benchmarks[argBenchmarkName](argCacheBenchmarkInputSize, argBenchmarkDuration)
        } else {
            externalLogger.error(`Benchmark ${argBenchmarkName} not found.`)
            process.exit(1)
        }
    }

    if (argv.help || argv.h) {
        externalLogger.info(helpMessage)
        process.exit(0)
    }
}

main(process.argv)
