import os from "os";


/**
 * Converts an Uint32Array to an hex string (Big Endian).
 *
 * **Note:** Hex values are always uppercase.
 *
 * **Note:** Detects platform endianness and reverses the array if needed.
 * @param arr The Uint32Array.
 * @returns The hex string.
 */
export function uint32ArrayBEToHex(arr: Uint32Array): string {
    const endianness = os.endianness();

    if (endianness === "LE") {
        arr = arr.reverse();
    }

    return Buffer.from(arr.buffer).toString("hex").toUpperCase();
}

/**
 * Converts an Uint32Array to an hex string (Little Endian).
 *
 * **Note:** Hex values are always uppercase.
 *
 * **Note:** Detects platform endianness and reverses the array if needed.
 * @param arr The Uint32Array.
 * @returns The hex string.
 */
export function uint32ArrayLEToHex(arr: Uint32Array): string {
    const endianness = os.endianness();

    if (endianness === "BE") {
        arr = arr.reverse();
    }

    return Buffer.from(arr.buffer).toString("hex").toUpperCase();
}