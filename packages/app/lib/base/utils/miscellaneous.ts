/**
 * Returns the invert of a hex color string (e.g. "#aabbcc" -> "#554433"),
 * for address closest-match overlay.
 * @param hexColor The hex color string to invert.
 * @returns The inverted hex color string.
 */
export function invertHexColor(hexColor: string): string {
    // Remove "#" if present
    const strippedHex = hexColor.replace(/^#/, "")
    if (strippedHex.length !== 6) return hexColor // Invalid format, return original

    const r = (255 - parseInt(strippedHex.slice(0, 2), 16)).toString(16).padStart(2, "0")
    const g = (255 - parseInt(strippedHex.slice(2, 4), 16)).toString(16).padStart(2, "0")
    const b = (255 - parseInt(strippedHex.slice(4, 6), 16)).toString(16).padStart(2, "0")

    return `#${r}${g}${b}`
}

/**
 * Takes in a hex color string and a opacity factor,
 * and returns the hex color with the applied opacity (4-channel hex).
 * @param hexColor The hex color string to modify.
 * @param opacity The opacity factor (0-1) to apply to the color.
 * @returns The modified hex color string with the applied opacity.
 */
export function applyHexColorOpacity(hexColor: string, opacity: number): string {
    // Clamp opacity between 0 and 1
    const clampedOpacity = Math.min(Math.max(opacity, 0), 1)

    // Remove "#" if present
    const strippedHex = hexColor.replace(/^#/, "")
    if (strippedHex.length !== 6) return hexColor // Invalid format, return original

    const alpha = Math.round(clampedOpacity * 255)
        .toString(16)
        .padStart(2, "0")

    return `#${strippedHex}${alpha}`
}
