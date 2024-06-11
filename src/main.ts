import minimist from "minimist";

import executeCacheBenchmark from "benchmarks/kernel/cache";
import config, { verifyConfig } from "configs/main.config";


/**
 * Main function.
 * @param args Arguments from the command line.
 */
function main(args: string[]) {
    const argv = minimist(args.slice(2));

    config.environment = argv.environment || argv.e || "production";
    verifyConfig();

    executeCacheBenchmark();

    // TODO

    if (argv.help || argv.h) {
        process.exit(0);
    };
}

main(process.argv);