import { bigintToMetricFormatted, bigintToScientific } from "@app/lib/base/utils/bigint"

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
 * Convenience wrapper: converts a Postgres `numeric` decimal string to a
 * `[coefficient, exponent]` scientific-notation tuple.
 * @param decimal The decimal string to convert, from a Postgres `numeric` column.
 * @param precision The number of decimal places to include in the coefficient (optional, defaults to 2).
 */
export function numericStringToScientific(decimal: string, precision = 2): [coefficient: string, exponent: number] {
    return bigintToScientific(BigInt(decimal), precision)
}

/**
 * Converts a numeric to a `en-US` formatted string.
 * @param decimal The decimal string to convert, from a Postgres `numeric` column.
 * @returns The formatted string representation of the decimal value.
 */
export function numericStringToFormatted(decimal: string): string {
    return BigInt(decimal).toLocaleString("en-US")
}

/**
 * Converts a numeric to a `en-US` formatted string with metric prefixes.
 * @param decimal The decimal string to convert, from a Postgres `numeric` column.
 * @returns The formatted string representation of the decimal value with metric prefixes.
 */
export function numericStringToMetricFormatted(decimal: string): string {
    return bigintToMetricFormatted(BigInt(decimal))
}
