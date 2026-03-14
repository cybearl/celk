/**
 * Stringify a JSON object with support for big integers (converted to strings).
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

/**
 * Parse a JSON object with support for big integers (converted from strings),
 * either positive or negative.
 * @param json The JSON string to parse.
 * @returns The parsed JSON object.
 */
export function parseWithBigIntSupport(json: string): unknown {
    return JSON.parse(json, (_, value) => {
        if (typeof value === "string" && /^-?\d+n$/.test(value)) return BigInt(value.slice(0, -1))
        return value
    })
}
