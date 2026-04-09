#include "core/generators/PCG64.hpp"
#include "core/constants.hpp"
#include <cstdint>
#include <cstring>
#include <pcg_random.hpp>
#include <stdexcept>
#include <uint128_t.h>
#include <uint256_t.h>

PCG64PrivateKeyGenerator::PCG64PrivateKeyGenerator(uint64_t _seed, uint64_t _streamId, uint256_t _advance)
    : highRng(_seed, _streamId * 2)
    , lowRng(_seed, _streamId * 2 + 1) {
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
    // Use 4 PCG64 calls to get 256 bits of randomness,
    // keeping in 4 uint64 parts for memcopy operations
    uint64_t parts[4] = {
        highRng(), // 0 - 7
        highRng(), // 8 - 15
        lowRng(), // 16 - 23
        lowRng() // 24 - 31
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
