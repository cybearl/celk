/**
 * Performs the `ROTL` operation on a 32-bit integer.=,
 * also known as "circular left shift".
 * @param x The value to rotate.
 * @param n The number of bits to rotate by.
 * @returns The rotated value.
 */
export const rotl = (x: number, n: number): number => (x << n) | (x >>> (32 - n))

/**
 * Performs the `ROTR` operation on a 32-bit integer,
 * also known as "circular right shift".
 * @param x The value to rotate.
 * @param n The number of bits to rotate by.
 * @returns The rotated value.
 */
export const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n))
