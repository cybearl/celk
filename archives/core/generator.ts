import config from "configs/main.config";
import MEMORY_TABLE from "lib/constants/memory";
import Ripemd160Algorithm from "lib/crypto/algorithms/ripemd160";
import { Secp256k1Algorithm_v1 } from "lib/crypto/algorithms/secp256k1";
import { Sha256Algorithm_v1 } from "lib/crypto/algorithms/sha256";
import Base58Encoder from "lib/crypto/encoders/base58";
import PrivateKeyGenerator from "lib/crypto/generators/privateKey";
import Cache from "lib/kernel/cache";
import { bigIntDiv } from "lib/utils/bigint";
import { formatHRTime } from "lib/utils/formats";
import logger from "lib/utils/logger";
import type { ComputationMode, Config } from "types/main";


/**
 * Generator generation mode.
 */
export type GeneratorGenMode = "PUBLIC_KEY" | "RIPEMD-160" | "ADDRESS";

/**
 * Generator `execute` endpoint return type.
 */
export type GeneratorExecuteReturn = {
    privateKey: bigint;
    value: Cache | string;
};

/**
 * Generator class used to generate Bitcoin addresses,
 * based on the shared config object.
 */
export default class Generator {
    private config: Config;

    private pkB: 33 | 65;

    private privateKeyGenerator: PrivateKeyGenerator;
    private secp256k1Algorithm: Secp256k1Algorithm_v1;
    private sha256Algorithm: Sha256Algorithm_v1;
    private ripemd160Algorithm: Ripemd160Algorithm;
    private base58Encoder: Base58Encoder;

    // Endpoints to run the generator based on the current computation mode
    private executeReportEndpoint: () => void;
    private executeEndpoint: () => GeneratorExecuteReturn;

    /**
     * Reusable cache used as a cache for all operations (186 bytes).
     *
     * See [here](https://github.com/yoratoni/celk#about-the-cache) for more information.
     */
    private cache = Cache.alloc(186);

    /**
     * Construct a new Bitcoin address generator from the shared config object,
     * based on the shared config object.
     */
    constructor() {
        this.config = config;

        this.pkB = (config.publicKeyGenMode === "COMPRESSED") ? 33 : 65;

        this.privateKeyGenerator = new PrivateKeyGenerator(
            config.privateKeyGenMode,
            MEMORY_TABLE.PRK.writeTo.bytes,
            config.privateKeyLowRange,
            config.privateKeyHighRange
        );
        this.secp256k1Algorithm = new Secp256k1Algorithm_v1(config.publicKeyGenMode);
        this.sha256Algorithm = new Sha256Algorithm_v1();
        this.ripemd160Algorithm = new Ripemd160Algorithm();
        this.base58Encoder = new Base58Encoder();

        switch (config.computationMode) {
            case "CPU":
                this.executeReportEndpoint = this.CPU__executeReport;
                this.executeEndpoint = this.CPU__execute;
                break;
            default:
                throw new Error("[Generator] constructor: Invalid computation mode.");
        }
    }

    /**
     * Change the Generator generation mode, mostly used for debugging.
     * @param generatorGenMode The new Generator generation mode.
     */
    setGeneratorGenMode = (generatorGenMode: GeneratorGenMode): void => {
        this.config.generatorGenMode = generatorGenMode;
    };

    /**
     * **[CPU]** Run the generator `n` times to benchmark the execution time of each step,
     * and show test results in the console, based on the shared config object.
     */
    private CPU__executeReport = (): void => {
        const VALUES: { [key: string]: string; } = {};
        const TIMES: { [key: string]: bigint; } = {};

        // Run the ghost execution n times to to warm up the engine
        for (let i = 0; i <= this.config.ghostExecutionIterations; i++) {
            // PRIVATE-KEY (PRK)
            const prkStart = process.hrtime.bigint();
            this.privateKeyGenerator.execute(this.cache, MEMORY_TABLE.PRK);
            TIMES.prk = process.hrtime.bigint() - prkStart;
            VALUES.prk = this.cache.subarray(
                MEMORY_TABLE.PRK.writeTo.offset,
                MEMORY_TABLE.PRK.writeTo.end
            ).toString("hex");

            // PUBLIC-KEY (PBL)
            const pblStart = process.hrtime.bigint();
            this.secp256k1Algorithm.execute(this.cache, MEMORY_TABLE.PBL);
            TIMES.pbl = process.hrtime.bigint() - pblStart;
            VALUES.pbl = this.cache.subarray(
                MEMORY_TABLE.PBL.writeTo.offset,
                MEMORY_TABLE.PBL.writeTo.offset + this.pkB
            ).toString("hex");

            // Stops here if we only want the public key
            if (this.config.generatorGenMode === "PUBLIC_KEY") continue;

            // Replace the "bytes" value of the SHA memory slot by the public key size (33 or 65)
            MEMORY_TABLE.SHA.readFrom.bytes = this.pkB;

            // Replace the "end" value of the SHA memory slot by the public key size + 33 or 65
            MEMORY_TABLE.SHA.readFrom.end = MEMORY_TABLE.SHA.readFrom.offset + this.pkB;

            // SHA-256 (SHA)
            const shaStart = process.hrtime.bigint();
            this.sha256Algorithm.execute(this.cache, MEMORY_TABLE.SHA);
            TIMES.sha = process.hrtime.bigint() - shaStart;
            VALUES.sha = this.cache.subarray(
                MEMORY_TABLE.SHA.writeTo.offset,
                MEMORY_TABLE.SHA.writeTo.end
            ).toString("hex");

            // RIPEMD-160 (RMD)
            const ripStart = process.hrtime.bigint();
            this.ripemd160Algorithm.execute(this.cache, MEMORY_TABLE.RMD);
            TIMES.rmd = process.hrtime.bigint() - ripStart;
            VALUES.rmd = this.cache.subarray(
                MEMORY_TABLE.RMD.writeTo.offset,
                MEMORY_TABLE.RMD.writeTo.end
            ).toString("hex");

            // Stops here if we only want the RIPEMD-160 hash
            if (this.config.generatorGenMode === "RIPEMD-160") continue;

            // SHA-256 CHK1 (SC1)
            const sc1Start = process.hrtime.bigint();
            this.sha256Algorithm.execute(this.cache, MEMORY_TABLE.SC1);
            TIMES.sc1 = process.hrtime.bigint() - sc1Start;
            VALUES.sc1 = this.cache.subarray(
                MEMORY_TABLE.SC1.writeTo.offset,
                MEMORY_TABLE.SC1.writeTo.end
            ).toString("hex");

            // SHA-256 CHK2 (SC2) -> overwrites SC1
            const sc2Start = process.hrtime.bigint();
            this.sha256Algorithm.execute(this.cache, MEMORY_TABLE.SC2);
            TIMES.sc2 = process.hrtime.bigint() - sc2Start;
            VALUES.sc2 = this.cache.subarray(
                MEMORY_TABLE.SC2.writeTo.offset,
                MEMORY_TABLE.SC2.writeTo.end
            ).toString("hex");

            // CHECKSUM (CHK)
            const chkStart = process.hrtime.bigint();
            this.cache.writeUint32BE(this.cache.readUint32BE(MEMORY_TABLE.CHK.readFrom.offset), MEMORY_TABLE.CHK.writeTo.offset);
            TIMES.chk = process.hrtime.bigint() - chkStart;
            VALUES.chk = this.cache.subarray(
                MEMORY_TABLE.CHK.writeTo.offset,
                MEMORY_TABLE.CHK.writeTo.end
            ).toString("hex");

            // ADDRESS (ADR)
            const adrStart = process.hrtime.bigint();
            VALUES.adr = this.base58Encoder.encode(this.cache, MEMORY_TABLE.ADR);
            TIMES.adr = process.hrtime.bigint() - adrStart;
        }

        // Report variables
        const totalTime = Object.values(TIMES).reduce((a, b) => a + b);
        let maxLogLength = 0;

        // Reports
        for (const [key, value] of Object.entries(TIMES)) {
            const percentage = bigIntDiv(value, totalTime, 6).num * 100;
            const paddedPercentage = percentage.toFixed(2).padStart(6, " ");

            let internalValue = `0x${VALUES[key]}`;
            if (key === "adr") internalValue = VALUES[key].padStart(VALUES.pbl.length + 2, " ");
            const log = `(${key.toUpperCase()}) EXECUTION: ${formatHRTime(value)} | WORKLOAD: ${paddedPercentage}% | SAMPLE: ${internalValue.padStart(VALUES.pbl.length + 2, " ")}`;

            if (percentage >= 50) logger.error(log);
            else if (percentage >= 20) logger.warn(log);
            else if (percentage >= 8) logger.silly(log);
            else if (percentage >= 1) logger.debug(log);
            else logger.info(log);

            // Get the longest log length
            if (log.length > maxLogLength) maxLogLength = log.length;
        }

        // Conclusion
        logger.info("=".repeat(maxLogLength));
        switch (this.config.generatorGenMode) {
            case "PUBLIC_KEY":
                logger.info(`(PBL) EXECUTION: ${formatHRTime(totalTime)} | WORKLOAD: 100.00% | RESULT: 0x${VALUES.pbl}`);
                break;
            case "RIPEMD-160":
                logger.info(`(RMD) EXECUTION: ${formatHRTime(totalTime)} | WORKLOAD: 100.00% | RESULT: ${`0x${VALUES.rmd}`.padStart(VALUES.pbl.length + 2, " ")}`);
                break;
            case "ADDRESS":
                logger.info(`(ADR) EXECUTION: ${formatHRTime(totalTime)} | WORKLOAD: 100.00% | RESULT: ${VALUES.adr.padStart(VALUES.pbl.length + 2, " ")}`);
                break;
            default:
                throw new Error("[Generator] executeReport: Invalid generator generation mode.");
        }

        console.log("");
    };

    /**
     * **[CPU]** Generate a Bitcoin address, RIPEMD-160 hash or public key (compressed or uncompressed),
     * based on the shared config object.
     * @returns The public key (cache), RIPEMD-160 hash (cache) or Bitcoin address (string).
     */
    private CPU__execute = (): GeneratorExecuteReturn => {
        // PRIVATE-KEY (PRK)
        const currPrivateKey = this.privateKeyGenerator.execute(this.cache, MEMORY_TABLE.PRK);

        // PUBLIC-KEY (PBL)
        this.secp256k1Algorithm.execute(this.cache, MEMORY_TABLE.PBL);

        // Stops here if we only want the public key
        if (this.config.generatorGenMode === "PUBLIC_KEY") return {
            privateKey: currPrivateKey,
            value: this.cache.subarray(
                MEMORY_TABLE.PBL.readFrom.offset,
                MEMORY_TABLE.PBL.readFrom.offset + this.pkB
            )
        };

        // Replace the "bytes" value of the SHA memory slot by the public key size (33 or 65)
        MEMORY_TABLE.SHA.readFrom.bytes = this.pkB;

        // Replace the "end" value of the SHA memory slot by the public key size + 33 or 65
        MEMORY_TABLE.SHA.readFrom.end = MEMORY_TABLE.SHA.readFrom.offset + this.pkB;

        // SHA-256 (SHA)
        this.sha256Algorithm.execute(this.cache, MEMORY_TABLE.SHA);

        // RIPEMD-160 (RMD)
        this.ripemd160Algorithm.execute(this.cache, MEMORY_TABLE.RMD);

        // Stops here if we only want the RIPEMD-160 hash (without network byte or checksum)
        if (this.config.generatorGenMode === "RIPEMD-160") return {
            privateKey: currPrivateKey,
            value: this.cache.subarray(
                MEMORY_TABLE.RMD.writeTo.offset,
                MEMORY_TABLE.RMD.writeTo.end
            )
        };

        // Double SHA-256 checksum (step 1)
        this.sha256Algorithm.execute(this.cache, MEMORY_TABLE.SC1);

        // Double SHA-256 checksum (step 2 -> overwrites step 1)
        this.sha256Algorithm.execute(this.cache, MEMORY_TABLE.SC2);

        // Take the first 4 bytes of the double SHA-256 checksum
        this.cache.writeUint32BE(
            this.cache.readUint32BE(MEMORY_TABLE.CHK.readFrom.offset),
            MEMORY_TABLE.CHK.writeTo.offset
        );

        // ADDRESS (ADR)
        return {
            privateKey: currPrivateKey,
            value: this.base58Encoder.encode(this.cache, MEMORY_TABLE.ADR)
        };
    };

    /**
     * Change the computation mode of the generator (spreads across shared config object).
     * @param computationMode The new computation mode.
     */
    setComputationMode = (computationMode: ComputationMode): void => {
        config.computationMode = computationMode;
        this.config.computationMode = computationMode;

        switch (computationMode) {
            case "CPU":
                this.executeReportEndpoint = this.CPU__executeReport;
                this.executeEndpoint = this.CPU__execute;
                break;
            default:
                throw new Error("[Generator] setComputationMode: Invalid computation mode.");
        }
    };

    /**
     * Run the generator `n` times to benchmark the execution time of each step,
     * and show test results in the console, based on the shared config object.
     */
    executeReport = (): void => this.executeReportEndpoint();

    /**
     * Generate a Bitcoin address, RIPEMD-160 hash or public key (compressed or uncompressed),
     * based on the shared config object.
     * @returns The public key (cache), RIPEMD-160 hash (cache) or Bitcoin address (string).
     */
    execute = (): GeneratorExecuteReturn => this.executeEndpoint();
}