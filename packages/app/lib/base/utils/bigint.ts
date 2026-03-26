/**
 * Formats a bigint as scientific notation using only integer arithmetic,
 * supporting arbitrarily large values (e.g., up to 2^256).
 *
 * Returns a tuple `[coefficient, exponent]` so callers can render the
 * exponent as a superscript if desired (e.g., `["4.61", 18]` for a value
 * around 4.61 × 10^18).
 *
 * @param value The bigint to format.
 * @param precision Number of decimal digits in the coefficient (default 2).
 */
export function bigintToScientific(value: bigint, precision = 2): [coefficient: string, exponent: number] {
    if (value === 0n) return ["0", 0]

    const digits = value.toString()
    const exponent = digits.length - 1

    if (exponent === 0) return [digits, 0]

    // Build coefficient string from the raw decimal digits (no floating-point involved)
    const raw = `${digits[0]}.${digits.slice(1, precision + 1).padEnd(precision, "0")}`
    const coefficient = raw.replace(/\.?0+$/, "")

    return [coefficient, exponent]
}

/**
 * Converts a bigint to a `en-US` formatted string with metric prefixes (e.g., 1,500 -> 1.5k).
 *
 * Note: This method supports any length of number up to exa.
 */
export function bigintToMetricFormatted(value: bigint): string {
    const isNegative = value < 0n
    const absValue = value < 0n ? -value : value

    // Units (up to Exa)
    // See https://en.wikipedia.org/wiki/Metric_prefix
    const units = ["", "k", "M", "G", "T", "P", "E"]

    // Magnitude
    const valueString = absValue.toString()
    let unitIndex = Math.floor((valueString.length - 1) / 3)

    // Clamping to the max unit available
    if (unitIndex >= units.length) unitIndex = units.length - 1
    if (unitIndex <= 0) return value.toString()

    // "Scaled" math: (value * 10) / (1000 ^ index)
    const divisor = 1000n ** BigInt(unitIndex)
    const scaled = (absValue * 10n) / divisor

    // Convert to string
    const scaledStr = scaled.toString()

    // Ensure at least 2 digits
    const paddedScaledStr = scaledStr.padStart(2, "0")

    // Insert the decimal point
    const integerPart = paddedScaledStr.slice(0, -1) || "0"
    const decimalPart = paddedScaledStr.slice(-1)

    const sign = isNegative ? "-" : ""
    const unit = units[unitIndex]

    return decimalPart === "0" ? `${sign}${integerPart}${unit}` : `${sign}${integerPart}.${decimalPart}${unit}`
}
