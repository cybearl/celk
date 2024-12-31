import externalLogger from "#lib/utils/external_logger"
import { formatHRTime, formatPercentage, formatUnit } from "#lib/utils/formats"

/**
 * The type of the benchmark function result.
 */
export type BenchmarkResult = {
    operationsPerSecond: number
    avgExecutionTime: number
    operations: number
}

/**
 * An object containing multiple benchmark results, ordered by functions.
 */
export type BenchmarkResults = {
    [fn: string]: BenchmarkResult
}

export default class Bench {
    /**
     * The duration of the benchmark in milliseconds.
     */
    benchmarkDuration: number

    /**
     * Stores the results of the benchmark.
     */
    results: BenchmarkResults = {}

    /**
     * Creates a new benchmarking instance.
     * @param benchmarkDuration The duration of the benchmark in milliseconds (optional, defaults to 256ms).
     */
    constructor(benchmarkDuration = 256) {
        this.benchmarkDuration = benchmarkDuration
    }

    /**
     * The main headless benchmarking function.
     *
     * Does not print anything to the console but returns the number of iterations per second
     * and the logs themselves for further formatting, such as console coloring depending on the results.
     * @param fn The function to run.
     * @param name The name of the function to run.
     * @returns The benchmark result (operations per second, average execution time, and total operations).
     */
    benchmark = (fn: () => unknown, name: string): void => {
        let res: unknown

        const initialTime = process.hrtime.bigint()

        let operationsPerSecond = 0
        let avgExecutionTime = 0
        let operations = 0
        let totalTime = 0n
        let t0 = 0n
        let t1 = 0n

        // Convert the milliseconds benchmark duration to nanoseconds (matching HRTime resolution)
        let internalBenchmarkDuration = BigInt(this.benchmarkDuration) * 1_000_000n

        for (let i = 0; i < Number.POSITIVE_INFINITY; i++) {
            t0 = process.hrtime.bigint()
            res = fn()
            t1 = process.hrtime.bigint()
            totalTime += t1 - t0

            if (t1 - initialTime >= internalBenchmarkDuration) {
                avgExecutionTime = Number(totalTime) / i
                operationsPerSecond = 1_000_000_000 / avgExecutionTime

                // Estimate the number of operations realized
                // Instead of measuring "i" because of the other operations in the loop
                operations = Number(t1 - initialTime) / avgExecutionTime

                // Access res to prevent the function from being optimized out
                // It slows down the benchmark but is necessary for the result to be far more accurate
                res = `${res}`

                // Break after one report
                break
            }
        }

        this.results[name] = {
            operationsPerSecond,
            avgExecutionTime: avgExecutionTime,
            operations: operations,
        }
    }

    /**
     * Formats and prints multiple benchmark results.
     * @param category The category of the benchmark results (optional, defaults to `RESULTS`).
     * @param clear Whether to clear the results object for the next benchmark (optional, defaults to `true`).
     */
    print = (category?: string, clear = true) => {
        if (!category) category = "RESULTS"

        console.log("")
        externalLogger.info(`${category.toUpperCase()}:`)
        externalLogger.info("=".repeat(category.length + 1))

        // Measure the longest function name for padding
        let longestFnName = 0
        for (const fn of Object.keys(this.results)) {
            if (fn.length > longestFnName) longestFnName = fn.length
        }

        // Sort the functions by their operations per second
        const functions = Object.entries(this.results).sort(
            (a, b) => b[1].operationsPerSecond - a[1].operationsPerSecond
        )

        for (const [fn, result] of functions) {
            // Add a percentage for each function
            // based on the fastest function's operations per second
            const fastestFn = functions[0][1].operationsPerSecond
            const percentage = (result.operationsPerSecond / fastestFn) * 100

            const formattedFnName = `>> ${fn} `.padEnd(longestFnName + 4, "═")
            const formattedAvgExecutionTime = `AVG TIME: ${formatHRTime(result.avgExecutionTime)}`
            const formattedOperationsPerSecond = `OPS: ${formatUnit(result.operationsPerSecond)}`
            const formattedPercentage = `PERCENTAGE: ${formatPercentage(percentage)}`

            const log = `${formattedFnName}═> ${formattedAvgExecutionTime} | ${formattedOperationsPerSecond} | ${formattedPercentage}`

            const indicatorPadding = 10
            if (percentage >= 90) externalLogger.debug(log + "(fastest)".padStart(indicatorPadding, " "))
            else if (percentage >= 60) externalLogger.silly(log + "(fast)".padStart(indicatorPadding, " "))
            else if (percentage >= 30) externalLogger.info(log + "(medium)".padStart(indicatorPadding, " "))
            else if (percentage >= 10) externalLogger.warn(log + "(slow)".padStart(indicatorPadding, " "))
            else externalLogger.error(log + "(slowest)".padStart(indicatorPadding, " "))
        }

        // Clear the results object for the next benchmark
        if (clear) this.results = {}
    }
}
