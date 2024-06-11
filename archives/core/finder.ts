import fs from "fs";
import path from "path";

import dedent from "dedent-js";

import config from "configs/main.config";
import Generator from "lib/core/generator";
import Cache from "lib/kernel/cache";
import { bigIntDiv, bigIntLength } from "lib/utils/bigint";
import { bigintToPrivateKey } from "lib/utils/conversions";
import { formatTime, formatUnit } from "lib/utils/formats";
import logger from "lib/utils/logger";
import type { ComputationMode, Config } from "types/main";


/**
 * Logging format.
 */
export type LoggingFormat = "LARGE" | "COMPACT";

/**
 * The finder stats object type.
 */
export type FinderStats = {
    privateKeysRange: bigint;
    lastReportIndex: bigint;
    lastReportTime: number;
    lastProgress: string;
    lastAps: bigint;
};

/**
 * Finder report file data type.
 */
export type ReportData = {
    input: string;
    privateKey: `0x${string}`;
    addressesPerSecond: string;
    elapsedTime: string;
    iterations: string;
}

/**
 * Find a private key from a given Bitcoin address or public key,
 * based on the shared config object.
 */
export default class Finder {
    private config: Config;
    private stats: FinderStats;

    private generator: Generator;

    // Endpoint to run the finder based on the current computation mode
    private executeEndpoint: () => void;

    /**
     * Construct a new Bitcoin address finder,
     * based on the shared config object.
     */
    constructor() {
        this.config = config;

        this.stats = {
            privateKeysRange: config.privateKeyHighRange - config.privateKeyLowRange,
            lastReportIndex: 0n,
            lastReportTime: 0,
            lastProgress: "",
            lastAps: 1024n  // First report after 1k iterations
        };

        this.generator = new Generator();

        switch (config.computationMode) {
            case "CPU":
                this.executeEndpoint = this.CPU__execute;
                break;
            default:
                throw new Error("[Finder] constructor: Invalid computation mode.");
        }
    }

    /**
     * Generate a progress report.
     * @param index The current progress index.
     * @param initialTime The initial time in ms.
     */
    private progressReport = (progressIndex: bigint, initialTime: number): void => {
        const currentReportTime = Date.now();

        // Prevent from showing the report too often
        if (currentReportTime - this.stats.lastReportTime < 650) return;

        const progress = formatUnit(Number(progressIndex), null, null, 8);
        this.stats.lastProgress = progress;

        let indicator = bigIntDiv(progressIndex, this.stats.privateKeysRange, bigIntLength(this.config.privateKeyHighRange)).str;

        // COMPACT format has a smaller progress indicator
        if (this.config.loggingFormat === "COMPACT") indicator = `${indicator.slice(0, 10)}%`;
        else indicator = `${indicator}%`;

        const rawElapsedTime = BigInt(currentReportTime - initialTime);
        this.stats.lastAps = (progressIndex * 1000n) / rawElapsedTime;
        const aps = formatUnit(Number(this.stats.lastAps), null, null, 0);

        switch (this.config.loggingFormat) {
            case "LARGE":
                logger.info(`Progress: ${progress} | Progress Indicator: ${indicator} | Addresses per second: ${aps}`);
                break;
            case "COMPACT":
                logger.info(`PRG: ${progress} | PI: ${indicator} | APS: ${aps}`);
                break;
        }

        // Stats update
        this.stats.lastReportIndex = progressIndex;
        this.stats.lastReportTime = Date.now();
    };

    /**
     * Generate a report file.
     * @param data The report data.
     */
    private fileReport = (data: ReportData): void => {
        let reportType = "";
        let inputType = "";
        let input = "";

        if (typeof this.config.publicKeyToFind === "string" && (this.config.publicKeyToFind as string).length > 0) {
            reportType = "public key";
            inputType = "public keys";

            // Remove the "0x" prefix
            if (this.config.publicKeyToFind.startsWith("0x")) input = this.config.publicKeyToFind.slice(2);
        } else {
            reportType = "address";
            inputType = "addresses";
            input = this.config.addressToFind as string;
        }

        const reportsDir = path.join(__dirname, "../", "../", "../", "reports");
        const reportDir = path.join(reportsDir, inputType, input);
        if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

        const utc = new Date().toISOString().replace(/:/g, "-");
        const reportPath = path.join(reportDir, `report-${utc}.txt`);

        const reportContent = dedent`Report for the ${reportType}: '${input}'.
            - Private key: ${data.privateKey}
            - Addresses per second: ${data.addressesPerSecond}
            - Elapsed time: ${data.elapsedTime}
            - Iterations: ${data.iterations}
        `;

        fs.writeFileSync(reportPath, reportContent);

        console.log("");
        logger.info(`Report generated for the ${reportType}: '${input}'.`);
        logger.info(`>> At: ${reportPath}`);
    };

    /**
     * **[CPU]** Find a private key from a given Bitcoin address or public key,
     * based on the shared config object.
     */
    private CPU__execute = (): void => {
        this.generator.execute();
        logger.info("Beginning the search...");

        // No loop limit if the mode is "RANDOM"
        const loopLimit = this.config.privateKeyGenMode === "RANDOM" ?
            2n ** 256n - 0x14551231950B75FC4402DA1732FC9BEBFn :
            this.config.privateKeyHighRange;

        const initialTime = Date.now();

        // Internal variables
        let found = false;
        let res: { privateKey: bigint; value: Cache | string; } = {
            privateKey: 0n,
            value: Cache.alloc(0)
        };

        // Main loop
        let i = 1n;
        for (i = 1n; i <= loopLimit; i++) {
            res = this.generator.execute();

            if (i % this.stats.lastAps === 0n) this.progressReport(i, initialTime);

            // Check if the value matches the one we're looking for
            // As addresses are reverted, the res.value is never a string
            if (this.config.input.equals(res.value as Cache)) {
                found = true;
                break;
            };
        }

        console.log("");

        if (!found) {
            logger.error(`Couldn't find the private key of '${this.config.untouchedInput}' within the given range!`);
        } else {
            const reportData: ReportData = {
                input: this.config.untouchedInput,
                privateKey: bigintToPrivateKey(res.privateKey),
                addressesPerSecond: formatUnit(Number(this.stats.lastAps), null, null, 0),
                elapsedTime: formatTime(Date.now() - initialTime, 0),
                iterations: formatUnit(Number(i), null, null, 0)
            };

            logger.warn(`Found the private key of '${reportData.input}'!`);
            logger.warn(`>> Private key: ${reportData.privateKey}`);
            logger.warn(`>> Addresses per second: ${reportData.addressesPerSecond}`);
            logger.warn(`>> Elapsed time: ${reportData.elapsedTime}`);
            logger.warn(`>> Iteration(s): ${reportData.iterations}`);

            this.fileReport(reportData);
        }

        console.log("");
    };

    /**
     * Change the computation mode of the finder (spreads across shared config object).
     * @param computationMode The new computation mode.
     */
    setComputationMode = (computationMode: ComputationMode): void => {
        config.computationMode = computationMode;
        this.config.computationMode = computationMode;

        switch (computationMode) {
            case "CPU":
                this.executeEndpoint = this.CPU__execute;
                break;
            default:
                throw new Error("[Finder] setComputationMode: Invalid computation mode.");
        }
    };

    /**
     * Find a private key from a given Bitcoin address or public key,
     * based on the shared config object.
     */
    execute = (): void => this.executeEndpoint();
}