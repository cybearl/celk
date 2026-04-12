#pragma once

#include <iostream>
#include <string>
#include <vector>

/**
 * @brief Converts a hexadecimal string to a byte array (vector of `uint8_t`).
 * @param hexString The hexadecimal string to convert (supports `0x` prefix).
 * @return A vector of `uint8_t` representing the byte array.
 */
std::vector<uint8_t> hexStringToVector(const std::string& hexString);

/**
 * @brief Converts a byte array to a hexadecimal string.
 * @param byteArray The byte array to convert.
 * @return A hexadecimal string representation of the byte array.
 */
std::string vectorToHexString(const std::vector<uint8_t>& byteArray);

/**
 * @brief Converts a raw buffer into a lowercase hex string.
 * @param buffer A pointer to the buffer to convert.
 * @param length The number of bytes to read from the buffer.
 * @return A lowercase hex string representation of the buffer contents.
 */
std::string bufferToHex(const uint8_t* buffer, size_t length);
