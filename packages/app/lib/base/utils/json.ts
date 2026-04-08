/**
 * Stringifies a JSON object with support for big integers (converted to strings).
 * @param object The object to stringify.
 * @param indent The number of spaces to indent (optional, defaults to 4).
 * @returns The stringified JSON object.
 */
export function stringifyWithBigIntSupport(object: unknown, indent = 4): string {
    return JSON.stringify(
        object,
        (_, value) => {
            if (typeof value === "bigint") return `${value.toString()}n`
            return value
        },
        indent,
    )
}
