import config from "configs/main.config";
import { formatHRTime, formatPercentage, formatUnit } from "lib/utils/formats";
import logger from "lib/utils/logger";


/**
 * The type of the benchmark function result.
 */
export type BenchmarkResult = {
    operationsPerSecond: number;
    avgExecutionTime: number;
    operations: number;
}

/**
 * The main headless benchmarking function.
 *
 * Does not print anything to the console but returns the number of iterations per second
 * and the logs themselves for further formatting, such as console coloring depending on the results.
 * @param fn The function to run.
 * @param options The options for the benchmarking:
 * - `testPassed`: Whether the test passed (optional).
 * - `benchmarkDuration`: The duration of the benchmark in milliseconds (optional, defaults to shared config object's `benchmarkDuration`).
 * @returns
 */
export default function benchmark(
    fn: () => unknown,
    options?: {
        testsPassed?: { expected: any, received: any }[],
        benchmarkDuration?: number
    }
): BenchmarkResult {
    let res: unknown;

    const initialTime = process.hrtime.bigint();

    let operationsPerSecond = 0;
    let avgExecutionTime = 0;
    let operations = 0;
    let totalTime = 0n;
    let t0 = 0n;
    let t1 = 0n;

    // Convert the milliseconds benchmark duration to nanoseconds (matching HRTime resolution)
    let internalBenchmarkDuration = BigInt(config.benchmarkDuration) * 1_000_000n;
    if (options?.benchmarkDuration) internalBenchmarkDuration = BigInt(options.benchmarkDuration) * 1_000_000n;

    for (let i = 0; i < Infinity; i++) {
        t0 = process.hrtime.bigint();
        res = fn();
        t1 = process.hrtime.bigint();
        totalTime += t1 - t0;

        if (t1 - initialTime >= internalBenchmarkDuration) {
            avgExecutionTime = Number(totalTime) / i;
            operationsPerSecond = 1_000_000_000 / avgExecutionTime;

            // Estimate the number of operations realized
            // Instead of measuring "i" because of the other operations in the loop
            operations = Number(t1 - initialTime) / avgExecutionTime;

            // Access res to prevent the function from being optimized out
            res = `${res}`;

            // Break after one report
            break;
        }
    }

    return {
        operationsPerSecond,
        avgExecutionTime: avgExecutionTime,
        operations: operations
    };
}

/**
 * An object containing multiple benchmark results, ordered by functions.
 */
export type BenchmarkResults = {
    [fn: string]: BenchmarkResult
}

/**
 * Formats and prints multiple benchmark results.
 * @param results The benchmark results to print.
 */
export function printBenchmarkResults(category: string, results: BenchmarkResults) {
    console.log("");
    logger.info(`${category.toUpperCase()}:`);

    // Measure the longest function name for padding
    let longestFnName = 0;
    for (const fn of Object.keys(results)) {
        if (fn.length > longestFnName) longestFnName = fn.length;
    }

    // Sort the functions by their operations per second
    const functions = Object.entries(results).sort((a, b) => b[1].operationsPerSecond - a[1].operationsPerSecond);

    for (const [fn, result] of functions) {
        // Add a percentage for each function
        // based on the fastest function's operations per second
        const fastestFn = functions[0][1].operationsPerSecond;
        const percentage = (result.operationsPerSecond / fastestFn) * 100;

        const formattedFnName = `>> ${fn} `.padEnd(longestFnName + 4, "═");
        const formattedAvgExecutionTime = `AVG TIME: ${formatHRTime(result.avgExecutionTime)}`;
        const formattedOperationsPerSecond = `OPS: ${formatUnit(result.operationsPerSecond)}`;
        const formattedPercentage = `PERCENTAGE: ${formatPercentage(percentage)}`;

        const log = `${formattedFnName}═> ${formattedAvgExecutionTime} | ${formattedOperationsPerSecond} | ${formattedPercentage}`;

        const indicatorPadding = 10;
        if (percentage >= 90) logger.info(log + "(fastest)".padStart(indicatorPadding, " "));
        else if (percentage >= 60) logger.debug(log + "(fast)".padStart(indicatorPadding, " "));
        else if (percentage >= 30) logger.silly(log + "(medium)".padStart(indicatorPadding, " "));
        else if (percentage >= 10) logger.warn(log + "(slow)".padStart(indicatorPadding, " "));
        else logger.error(log + "(slowest)".padStart(indicatorPadding, " "));
    }
}