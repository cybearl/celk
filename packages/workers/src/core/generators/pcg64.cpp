#include "core/constants.hpp"
#include "core/generators/interface.hpp"
#include <cstdint>
#include <cstring>
#include <pcg_random.hpp>
#include <uint128_t.h>
#include <uint256_t.h>

/**
 * @brief Uses PCG64 to generate a private-key (4 uint64 merged into a uint256) within
 * a specified range.
 */
struct PcgRangePrivateKeyGenerator : IPrivateKeyGenerator {
    pcg64 rng;
    uint256_t startRange;
    uint256_t rangeSize;

    // streamId: pass the thread index for non-overlapping streams
    PcgRangePrivateKeyGenerator(
        uint64_t _seed, uint64_t _streamId = 0, uint256_t _startRange = 1, uint256_t _endRange = SECP256K1_ORDER - 1)
        : rng(_seed, _streamId)
        , startRange(_startRange)
        , rangeSize(_endRange - _startRange + 1) {
        // Validate the range beforehand
        if (startRange < 1 || _endRange > SECP256K1_ORDER - 1) {
            throw std::invalid_argument("Range must be within [1, SECP256K1_ORDER - 1]");
        }
    }

    bool next(uint8_t privateKey[32]) override {
        // 4 PCG calls to get 256 bits of randomness
        uint64_t hh = rng(); // 0 - 7
        uint64_t hl = rng(); // 8 - 15
        uint64_t lh = rng(); // 16 - 23
        uint64_t ll = rng(); // 24 - 31

        // Merge all 4 into a uint256
        uint256_t value(uint128_t(hh, hl), uint128_t(lh, ll));

        // Clamping to get into the range
        uint256_t clampedValue = startRange + (value % rangeSize);

        // Serialize by getting the upper and lower values as uint128s from the uint256
        // and then doing the same with the returned uint128s to get 4 uint64s
        uint64_t parts[4] = {
            (uint64_t)clampedValue.upper().upper(),
            (uint64_t)clampedValue.upper().lower(),
            (uint64_t)clampedValue.lower().upper(),
            (uint64_t)clampedValue.lower().lower(),
        };

        std::memcpy(privateKey, parts, 32);

        return true;
    }
};
