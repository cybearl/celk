import minimist from "minimist";

import executeCacheBenchmark from "benchmarks/kernel/cache";
import { verifyConfig } from "configs/main.config";
import { helpErrorMessage } from "docs/commands";

import "dotenv/config";
import motd from "docs/motd";
import logger from "lib/utils/logger";


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
    motd();

    const argv = minimist(args.slice(2));

    verifyConfig();

    if (argv.benchmark || argv.b) {
        const benchmarkName = argv.benchmark || argv.b;
        const benchmark: (() => void) | undefined = benchmarks[benchmarkName];

        if (benchmark) {
            benchmark();
        } else {
            logger.error("No benchmark specified.");
            logger.error(helpErrorMessage);
            process.exit(1);
        }
    }

    // TODO

    if (argv.help || argv.h) {
        logger.info(helpErrorMessage);
        process.exit(0);
    };
}

main(process.argv);