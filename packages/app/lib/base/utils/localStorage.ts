/**
 * Extracts a number out of the local storage.
 * @param key The key to extract the number from.
 * @returns The extracted number or null if not found.
 */
export function extractNumberFromLocalStorage(key: string): number | null {
    const value = localStorage.getItem(key)
    const parsed = value ? parseInt(value, 10) : null
    return Number.isNaN(parsed) ? null : parsed
}
