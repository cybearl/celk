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
 * Fully deterministic and exhaustive: every key in the range is visited exactly once (given
 * step size 1), making it ideal for provably complete scans of small subranges or for testing.
 * Unlike PCG64, resumability is trivial, the current counter value is the resume cursor with
 * no `advance()` call needed. Partitioning across workers is done via non-overlapping `startRange` /
 * `endRange` pairs rather than stream IDs.
 */
struct SequentialPrivateKeyGenerator : IPrivateKeyGenerator {
    /**
     * @brief The step size for key generation.
     */
    uint256_t stepSize;

    /**
     * @brief The current counter value for key generation.
     */
    uint256_t counter;

    /**
     * @brief The end of the range for generated private keys.
     */
    uint256_t endRange;

    /**
     * @brief Constructs a new `SequentialPrivateKeyGenerator`.
     * @param _startRange The start of the range for generated private keys (optional, defaults to 1).
     * @param _endRange The end of the range for generated private keys (optional, defaults to `SECP256K1_ORDER - 1`).
     * @param _stepSize The step size for key generation (optional, defaults to 1).
     */
    SequentialPrivateKeyGenerator(
        uint256_t _startRange = 1, uint256_t _endRange = SECP256K1_ORDER - 1, uint256_t _stepSize = 1);

    AddressPrivateKeyGenerator getType() const override;
    bool next(uint8_t privateKey[32]) override;
};
