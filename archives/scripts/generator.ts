import config from "configs/main.config";
import Generator from "lib/core/generator";
import logger from "lib/utils/logger";


/**
 * Main function for the benchmarking of the Bitcoin address generator,
 * based on the shared config object.
 */
export function executeGeneratorBenchmark() {
    logger.info("Starting benchmarking of the Bitcoin address generator...");
    logger.info(`>> Public key generation: '${config.publicKeyGenMode}'`);

    console.log("");
    logger.info("Private keys generated within the range:");
    logger.info(`>> Low: ${config.privateKeyLowRange.toLocaleString("en-US")}`);
    logger.info(`>> High: ${config.privateKeyHighRange.toLocaleString("en-US")}`);
    logger.info(`>> Range: ${(config.privateKeyHighRange - config.privateKeyLowRange).toLocaleString("en-US")}`);

    const ghostExecutionIterationsStr = `${config.ghostExecutionIterations.toLocaleString("en-US")} ghost executions`;

    const generator = new Generator();

    console.log("");
    logger.info(`Ghost execution (${ghostExecutionIterationsStr}, 'PUBLIC_KEY' mode, random private key):`);
    generator.setGeneratorGenMode("PUBLIC_KEY");
    generator.executeReport();

    logger.info(`Ghost execution (${ghostExecutionIterationsStr}, 'RIPEMD-160' mode, random private key):`);
    generator.setGeneratorGenMode("RIPEMD-160");
    generator.executeReport();

    logger.info(`Ghost execution (${ghostExecutionIterationsStr}, 'ADDRESS' mode, random private key):`);
    generator.setGeneratorGenMode("ADDRESS");
    generator.executeReport();
}