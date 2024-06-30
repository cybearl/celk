import executeCacheBenchmark from "#tests/benchmarks/cache"
import minimist from "minimist"

/**
 * The type definition for a benchmark function.
 */
type BenchmarkFunction = (cacheBenchmarkInputSize: number, benchmarkDuration: number) => void

/**
 * Benchmark routing.
 */
const benchmarks: { [key: string]: BenchmarkFunction } = {
    cache: executeCacheBenchmark,
}

/**
 * Main function to route the benchmarks depending on the command line arguments.
 * @param args Arguments from the command line.
 */
function main(args: string[]) {
    const argv = minimist(args.slice(2))

    if (argv.benchmark || argv.b) {
        const benchmarkName = argv.benchmark || argv.b

        if (!benchmarkName) {
            logger.error(M_BENCHMARK_NAME_NOT_PROVIDED)
            process.exit(1)
        }

        const benchmark: BenchmarkFunction | undefined = benchmarks[benchmarkName]

        if (benchmark) {
            benchmark()
        } else {
            logger.error(M_BENCHMARK_NOT_FOUND)
            process.exit(1)
        }
    }

    if (argv.help || argv.h) {
        logger.info(M_HELP)
        process.exit(0)
    }
}

main(process.argv)
