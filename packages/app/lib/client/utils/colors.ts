/**
 * Parses "hsl(H, S%, L%)" and returns a dimmer variant for closest-match overlay
 * @param hsl The HSL color string to dim.
 * @returns A dimmer variant of the input HSL color string, or the original string if parsing fails.
 */
export function dimHslColor(hsl: string, lightnessFactor = 0.35): string {
    const match = hsl.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/)
    if (!match) return hsl

    return `hsl(${match[1]}, ${match[2]}%, ${(parseFloat(match[3]) * lightnessFactor).toFixed(1)}%)`
}
