
import config from "configs/main.config";
import MEMORY_TABLE from "lib/constants/memory";
import Ripemd160Algorithm from "lib/crypto/algorithms/ripemd160";
import { Secp256k1Algorithm_v1 } from "lib/crypto/algorithms/secp256k1";
import { Sha256Algorithm_v1 } from "lib/crypto/algorithms/sha256";
import Base58Encoder from "lib/crypto/encoders/base58";
import PrivateKeyGenerator from "lib/crypto/generators/privateKey";
import Cache from "lib/kernel/cache";
import logger from "lib/utils/logger";


const cache = Cache.alloc(186);

/**
 * Get samples of all the generators, encoders, and algorithms,
 * based on the shared config object.
 */
export default function executeSampler() {
    const privateKeyRange = config.privateKeyHighRange - config.privateKeyLowRange;
    const pkB = (config.publicKeyGenMode === "COMPRESSED") ? 33 : 65;
    let result: string;

    logger.info("Starting the sampler...");
    logger.info(`>> Public key generation mode: '${config.publicKeyGenMode}'`);
    logger.info(`>> Private key generation mode: '${config.privateKeyGenMode}'`);

    console.log("");
    logger.info("Private keys generated within the range:");
    logger.info(`>> Low: ${config.privateKeyLowRange.toLocaleString("en-US")}`);
    logger.info(`>> High: ${config.privateKeyHighRange.toLocaleString("en-US")}`);
    logger.info(`>> Range: ${privateKeyRange.toLocaleString("en-US")}`);

    const VALUES: { [key: string]: string; } = {};

    const privateKeyGenerator = new PrivateKeyGenerator(
        config.privateKeyGenMode,
        MEMORY_TABLE.PRK.writeTo.bytes,
        config.privateKeyLowRange,
        config.privateKeyHighRange
    );
    const secp256k1Algorithm = new Secp256k1Algorithm_v1(config.publicKeyGenMode);
    const sha256Algorithm = new Sha256Algorithm_v1();
    const ripemd160Algorithm = new Ripemd160Algorithm();
    const base58Encoder = new Base58Encoder();

    console.log("");
    logger.info("Sample:");

    // PRIVATE-KEY (PRK)
    privateKeyGenerator.execute(cache, MEMORY_TABLE.PRK);
    result = cache.subarray(
        MEMORY_TABLE.PRK.writeTo.offset,
        MEMORY_TABLE.PRK.writeTo.end
    ).toString("hex");
    VALUES.prk = `>> PRIVATE-KEY (PRK): 0x${result}`;

    // PUBLIC-KEY (PBL)
    secp256k1Algorithm.execute(cache, MEMORY_TABLE.PBL);
    result = cache.subarray(
        MEMORY_TABLE.PBL.writeTo.offset,
        MEMORY_TABLE.PBL.writeTo.offset + pkB
    ).toString("hex");
    VALUES.pbl = `>> PUBLIC-KEY (PBL): 0x${result}`;

    // Replace the "bytes" value of the SHA memory slot by the public key size (33 or 65)
    MEMORY_TABLE.SHA.readFrom.bytes = pkB;

    // Replace the "end" value of the SHA memory slot by the public key size + 33 or 65
    MEMORY_TABLE.SHA.readFrom.end = MEMORY_TABLE.SHA.readFrom.offset + pkB;

    // SHA-256 (SHA)
    sha256Algorithm.execute(cache, MEMORY_TABLE.SHA);
    result = cache.subarray(
        MEMORY_TABLE.SHA.writeTo.offset,
        MEMORY_TABLE.SHA.writeTo.end
    ).toString("hex");
    VALUES.sha = `>> SHA-256 (SHA): 0x${result}`;

    // RIPEMD-160 (RMD)
    ripemd160Algorithm.execute(cache, MEMORY_TABLE.RMD);
    result = cache.subarray(
        MEMORY_TABLE.RMD.writeTo.offset,
        MEMORY_TABLE.RMD.writeTo.end
    ).toString("hex");
    VALUES.rmd = `>> RIPEMD-160 (RMD): 0x${result}`;

    // SHA-256 CHK1 (SC1)
    sha256Algorithm.execute(cache, MEMORY_TABLE.SC1);
    result = cache.subarray(
        MEMORY_TABLE.SC1.writeTo.offset,
        MEMORY_TABLE.SC1.writeTo.end
    ).toString("hex");
    VALUES.sc1 = `>> SHA-256 CHK1 (SC1): 0x${result}`;

    // SHA-256 CHK2 (SC2)
    sha256Algorithm.execute(cache, MEMORY_TABLE.SC2);
    result = cache.subarray(
        MEMORY_TABLE.SC2.writeTo.offset,
        MEMORY_TABLE.SC2.writeTo.end
    ).toString("hex");
    VALUES.sc2 = `>> SHA-256 CHK2 (SC2): 0x${result}`;

    // CHECKSUM (CHK)
    cache.writeUint32BE(cache.readUint32BE(MEMORY_TABLE.CHK.readFrom.offset), MEMORY_TABLE.CHK.writeTo.offset);
    result = cache.subarray(
        MEMORY_TABLE.CHK.writeTo.offset,
        MEMORY_TABLE.CHK.writeTo.end
    ).toString("hex");
    VALUES.chk = `>> CHECKSUM (CHK): 0x${result}`;

    // ADDRESS (ADR)
    result = base58Encoder.encode(cache, MEMORY_TABLE.ADR);
    VALUES.adr = `>> ADDRESS (ADR): ${result}`;

    let maxLogLength = 0;
    for (const key in VALUES) {
        if (VALUES[key].length > maxLogLength) {
            maxLogLength = VALUES[key].length;
        }
    }

    for (const key in VALUES) {
        const parts = VALUES[key].split(":");
        const title = parts[0];
        const value = parts[1];
        const padding = " ".repeat(maxLogLength - VALUES[key].length);
        logger.info(`${title}:${padding}${value}`);
    }
}