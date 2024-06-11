
import config from "configs/main.config";
import Finder from "lib/core/finder";
import Cache from "lib/kernel/cache";
import { addressToRIPEMD160 } from "lib/utils/conversions";
import logger from "lib/utils/logger";


/**
 * Main function to find a private key from a given Bitcoin address or public key,
 * based on the shared config object.
 */
export function executeFinder() {
    const privateKeyRange = config.privateKeyHighRange - config.privateKeyLowRange;

    // Address or public key, both converted to a cache
    if (typeof config.publicKeyToFind === "string" && config.publicKeyToFind.length > 0) {
        // Remove the 0x prefix
        let publicKey = config.publicKeyToFind;
        if (config.publicKeyToFind.startsWith("0x")) publicKey = publicKey.slice(2);

        config.generatorGenMode = "PUBLIC_KEY";
        config.untouchedInput = publicKey;
        config.input = Cache.fromHexString(publicKey);
    } else {
        // Convert the address to a cache (decoding the base58 address to a RIPEMD-160 hash)
        config.generatorGenMode = "RIPEMD-160";
        config.untouchedInput = config.addressToFind as string;
        config.input = addressToRIPEMD160(config.addressToFind as string);
    }

    logger.info("Starting the Bitcoin address finder...");
    logger.info(`>> Computation mode: ${config.computationMode}`);
    logger.info(`>> Address to find: ${config.generatorGenMode === "RIPEMD-160" ? `'${config.untouchedInput}'` : "N/D"}`);
    if (config.generatorGenMode === "RIPEMD-160") logger.info(`>> RIPEMD-160 hash of this address: ${config.input.toString("hex")}`);
    logger.info(`>> Public key to find: ${config.generatorGenMode === "PUBLIC_KEY" ? `'${config.untouchedInput}'` : "N/D"}`);
    logger.info(`>> Public key generation mode: '${config.publicKeyGenMode}'`);
    logger.info(`>> Private key generation mode: '${config.privateKeyGenMode}'`);

    console.log("");
    logger.info("Private keys generated within the range:");
    logger.info(`>> Low: ${config.privateKeyLowRange.toLocaleString("en-US")}`);
    logger.info(`>> High: ${config.privateKeyHighRange.toLocaleString("en-US")}`);
    logger.info(`>> Range: ${privateKeyRange.toLocaleString("en-US")}`);

    console.log("");
    logger.warn("WARNING: This process is extremely slow and may take a long time to complete.");
    logger.warn("The speed of the process is directly related to the range of private keys to search.");
    logger.warn("Don't forget that it may take 1 day to thousands if not millions of years to find the private key!");
    logger.warn("Good luck! :)");

    if (config.privateKeyGenMode === "RANDOM") {
        console.log("");
        logger.warn("WARNING: You chose 'RANDOM' as the private key generation mode.");
        logger.warn("Private keys that have already been generated may be generated again.");
        logger.warn("In this mode, the progress percentage is replaced by an indicator.");
        logger.warn("This indicator shows how many times the iterations have come around the high range.");
    }

    console.log("");
    const ghostIterations = `${config.ghostExecutionIterations.toLocaleString("en-US")} ghost executions`;
    logger.info(`Ghost execution (${ghostIterations}):`);

    const finder = new Finder();
    finder.execute();
}