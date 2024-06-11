import { strInsert } from "lib/utils/formats";


/**
 * Get the length of a bigint.
 * @param input The bigint to get the length of.
 * @param radix The radix to use (optional, defaults to 10).
 * @returns The length of the bigint.
 */
export function bigIntLength(input: bigint, radix?: number): number {
    return input.toString(radix).length;
}

/**
 * Converts a bigint into its power of 10.
 * @param input The bigint to convert.
 * @param incr The increment to add to the power of 10 (optional, defaults to 0).
 * @returns The power of 10.
 */
export function bigIntToTenPow(input: bigint, incr = 0): bigint {
    const len = input.toString().length;
    return 10n ** BigInt(len + incr);
}

/**
 * Bigint division with decimal point at a specific precision.
 * - The `big` result don't have decimals but a decimal point position instead.
 * - The `float` result, the precision cannot be greater than 15 to be accurate.
 * - The `str` result is always accurate regardless of the precision.
 * @param numerator The numerator.
 * @param denominator The denominator.
 * @param precision The precision (optional, defaults to 2).
 * @returns An object with the result as a bigint + decimal point position, a float (limited in precision) and as a string (unlimited precision).
 */
export function bigIntDiv(numerator: bigint, denominator: bigint, precision = 2): {
    big: { value: bigint, decimalPointPosition: number };
    float: number;
    str: string;
} {
    // Prevent division by zero (replace denominator with 1)
    let boundedDenominator = denominator;
    if (denominator === 0n) boundedDenominator = 1n;

    // Add a bit of precision to the result to avoid rounding errors
    const hiddenAddedPrecision = 2;

    // Get the percentage with no decimal point
    const percentageWithNoDP = (numerator * bigIntToTenPow(boundedDenominator, precision + hiddenAddedPrecision)) / boundedDenominator;
    const percentageWithNoDPStr = percentageWithNoDP.toString();

    // Get the position of the decimal point
    const pos = (bigIntLength(boundedDenominator) - percentageWithNoDPStr.length + precision + hiddenAddedPrecision);

    let percentageStr = "";

    // Notes:
    // - If pos < 0, result is >= 1
    // - If pos >= 0, result is < 1
    if (pos < 0) {
        // Insert the decimal point at the right position
        percentageStr = strInsert(percentageWithNoDPStr, Math.abs(pos), ".");

        // Trim the amount of decimals to the precision after the decimal point
        percentageStr = percentageStr.substring(0, percentageStr.indexOf(".") + precision + hiddenAddedPrecision + 1);
    } else {
        // Prevents to have "0." as a result when precision is 0
        if (precision === 0) {
            percentageStr = "0";
        } else {
            // Pad the decimal point with zeros
            percentageStr = "0." + `${"".padEnd(pos, "0")}${percentageWithNoDPStr}`.slice(0, precision);
        }
    }

    return {
        big: {
            value: percentageWithNoDP,
            decimalPointPosition: pos
        },
        float: Number(percentageStr),
        str: percentageStr
    };
}

/**
 * Returns the number of bytes required to represent a bigint.
 * @param input The bigint to check.
 * @returns The number of bytes required to represent the bigint.
 */
export function bigIntByteLength(input: bigint): number {
    return Math.ceil(input.toString(16).length / 2);
}