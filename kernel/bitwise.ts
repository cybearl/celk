/**
 * Performs the `ROTL` operation on a 32-bit integer.=,
 * also known as "circular left shift".
 * @param x The value to rotate.
 * @param n The number of bits to rotate by.
 * @returns The rotated value.
 */
export const rotl32 = (x: number, n: number): number => (x << n) | (x >>> (32 - n))

/**
 * Performs the `ROTR` operation on a 32-bit integer,
 * also known as "circular right shift".
 * @param x The value to rotate.
 * @param n The number of bits to rotate by.
 * @returns The rotated value.
 */
export const rotr32 = (x: number, n: number): number => (x >>> n) | (x << (32 - n))

/**
 * Performs a safe addition operation on two 32-bit integers.
 * @param x The first number to add.
 * @param y The second number to add.
 * @returns The sum of the two numbers.
 */
export const safeAdd32 = (x: number, y: number): number => {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >>> 16) + (y >>> 16) + (lsw >>> 16)
    return (msw << 16) | (lsw & 0xffff)
}

/**
 * Performs a safe addition operation on any number of 32-bit integers.
 * @param args The numbers to add.
 * @returns The sum of the numbers.
 */
export const safeAdd32Many = (...args: number[]): number => args.reduce(safeAdd32, 0)
