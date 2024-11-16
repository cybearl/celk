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
 * Performs a safe addition on two 32-bit integers.
 * @param a The first number to add.
 * @param b The second number to add.
 * @returns The sum of the two numbers.
 */
export const safeAdd32 = (a: number, b: number): number => {
    const lsw = (a & 0xffff) + (b & 0xffff)
    return (((a >>> 16) + (b >>> 16) + (lsw >>> 16)) << 16) | (lsw & 0xffff)
}

/**
 * Performs a safe addition on three 32-bit integers.
 * @param a The first number to add.
 * @param b The second number to add.
 * @param c The third number to add.
 * @returns The sum of the three numbers.
 */
export const safeAdd32x3 = (a: number, b: number, c: number): number => {
    const lsw = (a & 0xffff) + (b & 0xffff) + (c & 0xffff)
    return (((a >>> 16) + (b >>> 16) + (c >>> 16) + (lsw >>> 16)) << 16) | (lsw & 0xffff)
}

/**
 * Performs a safe addition on four 32-bit integers.
 * @param a The first number to add.
 * @param b The second number to add.
 * @param c The third number to add.
 * @param d The fourth number to add.
 * @returns The sum of the four numbers.
 */
export const safeAdd32x4 = (a: number, b: number, c: number, d: number): number => {
    const lsw = (a & 0xffff) + (b & 0xffff) + (c & 0xffff) + (d & 0xffff)
    return (((a >>> 16) + (b >>> 16) + (c >>> 16) + (d >>> 16) + (lsw >>> 16)) << 16) | (lsw & 0xffff)
}

/**
 * Performs a safe addition on five 32-bit integers.
 * @param a The first number to add.
 * @param b The second number to add.
 * @param c The third number to add.
 * @param d The fourth number to add.
 * @param e The fifth number to add.
 * @returns The sum of the five numbers.
 */
export const safeAdd32x5 = (a: number, b: number, c: number, d: number, e: number): number => {
    const lsw = (a & 0xffff) + (b & 0xffff) + (c & 0xffff) + (d & 0xffff) + (e & 0xffff)
    return (((a >>> 16) + (b >>> 16) + (c >>> 16) + (d >>> 16) + (e >>> 16) + (lsw >>> 16)) << 16) | (lsw & 0xffff)
}
