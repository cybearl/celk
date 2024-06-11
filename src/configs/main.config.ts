import { helpErrorMessage } from "docs/commands";
import { SECP256K1_CURVE } from "lib/constants/crypto";
import type { PrivateKeyGenMode } from "lib/kernel/crypto/generators/privateKeyGenerator";
import logger from "lib/utils/logger";
import { isBitcoinAddressValid, isEthereumAddressValid } from "lib/utils/wallets";
import type { Config } from "types/main.config";


/**
 * The main configuration object, shared across the entire system.
 */
const config: Config = {
    environment: "production",
    addressToFind: "13zb1hQbWVsc2S7ZTZnP2G4undNNpdh5so",
    publicKeyToFind: null,
    reverseAddressIntoPublicKey: false,
    isPublicKeyCompressed: true,
    privateKeyGenMode: "RANDOM",
    privateKeyLowRange: SECP256K1_CURVE.h,
    privateKeyHighRange: SECP256K1_CURVE.n,
    benchmarkDuration: 256,
    cacheBenchmarkInputSize: 128
};

/**
 * Verifies that all the properties of the config object are valid.
 */
export function verifyConfig() {
    const privateKeyGenModes: PrivateKeyGenMode[] = ["RANDOM", "ASCENDING", "DESCENDING"];

    const errors: string[] = [];

    if (config.environment !== "production" && config.environment !== "development") {
        errors.push("The environment must be either 'production' or 'development'.");
    }

    if (config.addressToFind === null && config.publicKeyToFind === null) {
        errors.push("The address OR public key to find must be set.");
    }

    if (config.addressToFind !== null && config.publicKeyToFind !== null) {
        errors.push("The address AND public key to find cannot be set at the same time.");
    }

    if (config.addressToFind) {
        if (!isBitcoinAddressValid(config.addressToFind) && !isEthereumAddressValid(config.addressToFind)) {
            errors.push("The address to find is not a valid Bitcoin or Ethereum address.");
        }
    }

    if (config.publicKeyToFind && config.reverseAddressIntoPublicKey) {
        errors.push("The public key to find and reverse address into public key mode cannot be set at the same time.");
    }

    if (config.isPublicKeyCompressed !== true && config.isPublicKeyCompressed !== false) {
        errors.push("The public key compression flag must be a boolean.");
    }

    if (!privateKeyGenModes.includes(config.privateKeyGenMode)) {
        errors.push(`Invalid private key generation mode: '${config.privateKeyGenMode}'.`);
    }

    if (config.privateKeyLowRange < 1n) {
        errors.push("The private key low range must be greater than or equal to 1.");
    }

    if (config.privateKeyLowRange > SECP256K1_CURVE.n) {
        errors.push("The private key low range must be less than or equal to the SECP256K1 curve order.");
    }

    if (config.privateKeyHighRange < 1n) {
        errors.push("The private key high range must be greater than or equal to 1.");
    }

    if (config.privateKeyHighRange > SECP256K1_CURVE.n) {
        errors.push("The private key high range must be less than or equal to the SECP256K1 curve order.");
    }

    if (config.privateKeyHighRange < config.privateKeyLowRange) {
        errors.push("The private key high range must be greater than or equal to the low range.");
    }

    if (config.benchmarkDuration <= 0) {
        errors.push("The benchmark duration must be greater than 0.");
    }

    if (config.cacheBenchmarkInputSize <= 0) {
        errors.push("The cache benchmark input size must be greater than 0.");
    }

    // If there are any errors, log them and exit the process
    if (errors.length > 0) {
        logger.error("[FATAL] Invalid configuration!");
        for (const error of errors) logger.error(`>> ${error}`);
        logger.error(helpErrorMessage);

        process.exit(1);
    }
}

export default config;