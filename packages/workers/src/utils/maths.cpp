#include "utils/maths.hpp"
#include "core/constants.hpp"
#include <stdexcept>
#include <uint128_t.h>
#include <uint256_t.h>

void clampPrivateKeyToRange(
    const uint8_t privateKey[32], uint8_t outputKey[32], uint256_t startRange, uint256_t endRange) {
    // Validate the range beforehand
    if (startRange < 1 || endRange > SECP256K1_ORDER - 1) {
        throw std::invalid_argument("Range must be within [1, SECP256K1_ORDER - 1]");
    }

    // Convert the private key into 4 uint64s
    uint64_t keyParts[4];
    for (int i = 0; i < 4; ++i) {
        uint64_t rawPart;
        std::memcpy(&rawPart, privateKey + i * 8, 8);
        keyParts[i] = _byteswap_uint64(rawPart);
    }

    // Convert the parts into two uint128s and then a uint256
    uint256_t value(uint128_t(keyParts[0], keyParts[1]), uint128_t(keyParts[2], keyParts[3]));

    uint256_t rangeSize = endRange - startRange + 1;
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
        uint64_t be = _byteswap_uint64(parts[i]);
        std::memcpy(outputKey + i * 8, &be, 8);
    }
}
