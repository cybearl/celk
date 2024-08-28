/**
 * The `Base58Encoder` class is used to encode data coming from a
 * `Cache` instance to a Base58 string based on the current encoding.
 *
 * It also provides methods to decode Base58 strings back to
 * their bytecode and write them directly in a `Cache` instance
 * at a certain position given by a `MemorySlot` object.
 *
 * More info about the Base58 encoding can be found at:
 * - [Wiki](https://en.bitcoin.it/wiki/Base58Check_encoding).
 * - [YouTube Video](https://www.youtube.com/watch?v=GedV3S9X89c).
 * - [Medium](https://medium.com/concerning-pharo/understanding-base58-encoding-23e673e37ff6).
 */
export default class Base58Encoder {
    private readonly _CHARSET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

    /**
     * Creates a new `Base58Encoder` instance.
     */
    constructor() {}

    /**
     * Gets the decimal value of a string based on the characters ASCII code
     * and their position inside the string.
     * @param str The string to get the decimal value from.
     * @returns The decimal value of the string.
     */
    _getStringDecimalValue(str: string) {
        let value = 0
        for (let i = str.length - 1; i >= 0; i--) {
            // ASCII code * 2 ^ (position (from right to left) * 8)
            value += str.charCodeAt(i) * 2 ** ((str.length - 1 - i) * 8)
        }

        return value
    }

    /**
     * Gets the string value of a decimal number based on the Base58 charset.
     * @param value The decimal number to get the string value from.
     * @returns The string value of the decimal number.
     */
    _getDecimalStringValue(value: number) {
        let str = ""

        while (value > 0) {
            // Get the remainder of the division by 58
            str = this._CHARSET[value % 58] + str
            // Get the integer division by 58
            value = Math.floor(value / 58)
        }

        return str
    }

    /**
     * Encodes a string into a Base58 encoded string.
     * @param str The string to encode.
     * @returns The Base58 encoded string.
     */
    encode(str: string) {
        let value = this._getStringDecimalValue(str)
        let encoded = ""

        while (value > 0) {
            // Get the remainder of the division by 58
            encoded = this._CHARSET[value % 58] + encoded
            // Get the integer division by 58
            value = Math.floor(value / 58)
        }

        return encoded
    }

    /**
     * Decodes a Base58 encoded string back to its original string.
     * @param encoded The Base58 encoded string to decode.
     * @returns The original string.
     */
    decode(encoded: string) {
        let value = 0

        for (let i = encoded.length - 1; i >= 0; i--) {
            // Get the position of the character in the charset
            let position = this._CHARSET.indexOf(encoded[i])
            // Get the decimal value of the character
            value += position * 58 ** (encoded.length - 1 - i)
        }

        return this._getDecimalStringValue(value)
    }
}
