#pragma once

#include "core/constants.hpp"
#include <secp256k1.h>

/**
 * @brief Clamps a 32-byte private key and writes it to an output buffer.
 * @param privateKey The 32-byte private key to clamp.
 * @param outputKey The fixed 32-byte array to fill with the generated private key.
 * @param startRange The start of the range for clamping (optional, defaults to 1).
 * @param endRange The end of the range for clamping (optional, defaults to `SECP256K1_ORDER - 1`).
 */
void clampPrivateKeyToRange(const uint8_t privateKey[32],
    uint8_t outputKey[32],
    uint256_t startRange = 1,
    uint256_t endRange = SECP256K1_ORDER - 1);
