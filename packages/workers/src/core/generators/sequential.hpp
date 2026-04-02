#pragma once

#include "address.hpp"
#include "core/constants.hpp"
#include "core/generators/interface.hpp"
#include <cstdint>
#include <uint256_t.h>

/**
 * @brief Generates private keys sequentially within a specified range, starting from a given point
 * and incrementing by a defined step size.
 *
 * This is useful for exhaustive key searches or testing scenarios where deterministic
 * key generation is required.
 */
struct SequentialPrivateKeyGenerator : IPrivateKeyGenerator {
    uint256_t stepSize;
    uint256_t counter;
    uint256_t endRange;

    SequentialPrivateKeyGenerator(
        uint256_t _startRange = 1, uint256_t _endRange = SECP256K1_ORDER - 1, uint256_t _stepSize = 1);

    AddressPrivateKeyGenerator getType() const override;
    bool next(uint8_t privateKey[32]) override;
};
