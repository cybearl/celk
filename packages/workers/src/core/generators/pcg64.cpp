#include "core/generators/PCG64.hpp"
#include "core/constants.hpp"
#include <cstdint>
#include <cstring>
#include <pcg_random.hpp>
#include <stdexcept>
#include <uint128_t.h>
#include <uint256_t.h>

PCG64PrivateKeyGenerator::PCG64PrivateKeyGenerator(
    uint64_t _seed, uint64_t _streamId, uint256_t _advance, uint256_t _startRange, uint256_t _endRange)
    : highRng(_seed, _streamId * 2)
    , lowRng(_seed, _streamId * 2 + 1)
    , startRange(_startRange)
    , rangeSize(_endRange - _startRange + 1) {
    // Validate the range beforehand
    if (startRange < 1 || _endRange > SECP256K1_ORDER - 1) {
        throw std::invalid_argument("Range must be within [1, SECP256K1_ORDER - 1]");
    }

    // Converting the uint256 into a native __uint128_t for advancement
    __uint128_t advanceVal
        = ((__uint128_t)(uint64_t)_advance.lower().upper() << 64) | (uint64_t)_advance.lower().lower();

    // Advancing twice since there's two operations per generator per call
    highRng.advance(advanceVal * 2);
    lowRng.advance(advanceVal * 2);
}

AddressPrivateKeyGenerator PCG64PrivateKeyGenerator::getType() const {
    return AddressPrivateKeyGenerator::PCG64;
}

bool PCG64PrivateKeyGenerator::next(uint8_t privateKey[32]) {
    // Use 4 PCG64 calls to get 256 bits of randomness
    uint64_t hh = highRng(); // 0 - 7
    uint64_t hl = highRng(); // 8 - 15
    uint64_t lh = lowRng(); // 16 - 23
    uint64_t ll = lowRng(); // 24 - 31

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

    // Copy the 4 uint64s into the private key array while swapping the byte
    // order of each uint64 to match the expected big-endian format
    // (secp256k1 uses big-endian)
    for (int i = 0; i < 4; i++) {
        uint64_t be = __builtin_bswap64(parts[i]);
        std::memcpy(privateKey + i * 8, &be, 8);
    }

    return true;
}
