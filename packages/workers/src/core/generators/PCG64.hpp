#pragma once

#include "address.hpp"
#include "core/constants.hpp"
#include "core/generators/interface.hpp"
#include <cstdint>
#include <pcg_random.hpp>
#include <uint256_t.h>

/**
 * @brief Uses PCG64 to generate a private-key (4 uint64 merged into a uint256) within
 * a specified range.
 */
struct PCG64PrivateKeyGenerator : IPrivateKeyGenerator {
    pcg64 rng;
    uint256_t startRange;
    uint256_t rangeSize;

    PCG64PrivateKeyGenerator(
        uint64_t _seed, uint64_t _streamId = 0, uint256_t _startRange = 1, uint256_t _endRange = SECP256K1_ORDER - 1);

    AddressPrivateKeyGenerator getType() const override;
    bool next(uint8_t privateKey[32]) override;
};
