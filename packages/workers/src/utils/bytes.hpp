#pragma once

#include <cstdint>

/**
 * @brief Reads the last byte of a big-endian 32-byte key buffer.
 * @param key The 32-byte key buffer to read from.
 * @return The value of the last byte (only correct for values that fit in a single byte, i.e. <= 0xFF).
 */
uint8_t readLastByte(const uint8_t key[32]);

/**
 * @brief Checks that all bytes except the last are zero in a 32-byte key buffer.
 * @param key The 32-byte key buffer to inspect.
 * @return True if bytes 0-30 are all zero, false otherwise.
 */
bool areAllBytesZeroExceptLast(const uint8_t key[32]);

/**
 * @brief Builds a 32-byte big-endian private key buffer from a `uint8_t` value.
 * @param out The 32-byte output buffer to write the key into.
 * @param value The value to place in the last byte (all upper bytes are set to zero).
 */
void buildBigEndianPrivateKeyFromUint8(uint8_t out[32], uint8_t value);
