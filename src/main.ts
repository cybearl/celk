import minimist from "minimist";

import executeCacheBenchmark from "benchmarks/kernel/cache";
import { verifyConfig } from "configs/main.config";

import "dotenv/config";


/**
 * Main function.
 * @param args Arguments from the command line.
 */
function main(args: string[]) {
    const argv = minimist(args.slice(2));

    verifyConfig();

    executeCacheBenchmark();

    // TODO

    if (argv.help || argv.h) {
        process.exit(0);
    };
}

main(process.argv);