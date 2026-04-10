#include "core/generators/sequential.hpp"
#include "core/constants.hpp"
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <uint256_t.h>

SequentialPrivateKeyGenerator::SequentialPrivateKeyGenerator(
    uint256_t _startRange, uint256_t _endRange, uint256_t _stepSize)
    : stepSize(_stepSize)
    , counter(_startRange)
    , endRange(_endRange) {
    // Validate the range beforehand
    if (_startRange < 1 || _endRange > SECP256K1_ORDER - 1) {
        throw std::invalid_argument("Range must be within [1, SECP256K1_ORDER - 1]");
    }
}

AddressPrivateKeyGenerator SequentialPrivateKeyGenerator::getType() const {
    return AddressPrivateKeyGenerator::Sequential;
}

bool SequentialPrivateKeyGenerator::next(uint8_t privateKey[32]) {
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

    // Copy the 4 uint64s into the private key array while swapping the byte
    // order of each uint64 to match the expected big-endian format
    // (secp256k1 uses big-endian)
    for (int i = 0; i < 4; i++) {
        uint64_t be = _byteswap_uint64(parts[i]);
        std::memcpy(privateKey + i * 8, &be, 8);
    }

    return true;
}
