import minimist from "minimist";

import executeCacheBenchmark from "benchmarks/kernel/cache";
import { verifyConfig } from "configs/main.config";
import { M_BENCHMARK_NAME_NOT_PROVIDED, M_BENCHMARK_NOT_FOUND, M_CREDITS, M_HELP } from "docs/messages";
import logger from "lib/utils/logger";
import "dotenv/config";


/**
 * Benchmark routing.
 */
const benchmarks: { [key: string]: () => void } = {
    "cache": executeCacheBenchmark
};

/**
 * Main function.
 * @param args Arguments from the command line.
 */
function main(args: string[]) {
    const argv = minimist(args.slice(2));

    verifyConfig();

    if (argv.benchmark || argv.b) {
        const benchmarkName = argv.benchmark || argv.b;

        if (!benchmarkName) {
            logger.error(M_BENCHMARK_NAME_NOT_PROVIDED);
            process.exit(1);
        }

        const benchmark: (() => void) | undefined = benchmarks[benchmarkName];

        if (benchmark) {
            benchmark();
        } else {
            logger.error(M_BENCHMARK_NOT_FOUND);
            process.exit(1);
        }
    }

    // TODO

    if (argv.help || argv.h) {
        logger.info(M_HELP);
        process.exit(0);
    };

    if (argv.credits || argv.c) {
        logger.info(M_CREDITS);
        process.exit(0);
    }
}

main(process.argv);