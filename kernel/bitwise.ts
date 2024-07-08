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

/**
 * Performs a safe addition operation on two 32-bit integers.
 * @param x The first number to add.
 * @param y The second number to add.
 * @returns The sum of the two numbers.
 */
export const safeAdd = (x: number, y: number): number => {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >>> 16) + (y >>> 16) + (lsw >>> 16)
    return (msw << 16) | (lsw & 0xffff)
}
