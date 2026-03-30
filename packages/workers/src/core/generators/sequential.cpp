#include "core/constants.hpp"
#include "core/generators/interface.hpp"
#include <cstdint>
#include <cstring>
#include <uint256_t.h>

/**
 *
 */
struct SequentialPrivateKeyGenerator : IPrivateKeyGenerator {
    uint256_t stepSize;
    uint256_t counter;
    uint256_t endRange;

    SequentialPrivateKeyGenerator(
        uint256_t initialStartRange = 1, uint256_t initialEndRange = SECP256K1_ORDER - 1, uint256_t initialStepSize = 1)
        : stepSize(initialStepSize)
        , counter(initialStartRange)
        , endRange(initialEndRange) {
        // Validate the range beforehand
        if (initialStartRange < 1 || initialEndRange > SECP256K1_ORDER - 1) {
            throw std::invalid_argument("Range must be within [1, SECP256K1_ORDER - 1]");
        }
    }

    bool next(uint8_t privateKey[32]) {
        if (counter > endRange) {
            return false;
        }

        uint256_t value = counter;
        counter += stepSize;

        // Serialize by getting the upper and lower values as uint128s from the uint256
        // and then doing the same with the returned uint128s to get 4 uint64s
        uint64_t parts[4] = {
            (uint64_t)value.upper().upper(),
            (uint64_t)value.upper().lower(),
            (uint64_t)value.lower().upper(),
            (uint64_t)value.lower().lower(),
        };

        std::memcpy(privateKey, parts, 32);

        return true;
    }
};
