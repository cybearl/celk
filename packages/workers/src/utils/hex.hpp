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
