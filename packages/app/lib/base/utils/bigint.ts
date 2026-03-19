/**
 * Converts a hex string (without "0x" prefix) to a decimal string
 * suitable for Postgres `numeric` columns.
 * @param hex The hex string to convert, without the "0x" prefix.
 * @returns The decimal string representation of the hex value,
 * suitable for Postgres `numeric` columns.
 */
export function hexToNumericString(hex: string): string {
    return BigInt(`0x${hex}`).toString()
}

/**
 * Converts a Postgres `numeric` decimal string to a hex string
 * with a "0x" prefix.
 * @param decimal The decimal string to convert, from a Postgres `numeric` column.
 * @returns The hex string representation of the decimal value, with a "0x" prefix.
 */
export function numericStringToHex(decimal: string): string {
    return `0x${BigInt(decimal).toString(16)}`
}

/**
 * Formats a bigint as scientific notation using only integer arithmetic,
 * supporting arbitrarily large values (e.g. up to 2^256).
 *
 * Returns a tuple `[coefficient, exponent]` so callers can render the
 * exponent as a superscript if desired (e.g. `["4.61", 18]` for a value
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
 * Convenience wrapper: converts a Postgres `numeric` decimal string to a
 * `[coefficient, exponent]` scientific-notation tuple.
 */
export function numericStringToScientific(decimal: string, precision = 2): [coefficient: string, exponent: number] {
    return bigintToScientific(BigInt(decimal), precision)
}
