#include "utils/maths.hpp"
#include "utils/bytes.hpp"
#include "utils/hex.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <cstring>

TEST_CASE("clampPrivateKeyToRange: output is always within [startRange, endRange]", "[utils][maths]") {
    uint8_t rawKey[32], outputKey[32];

    SECTION("all-zero key clamped to start of range") {
        buildBigEndianPrivateKeyFromUint8(rawKey, 0);
        clampPrivateKeyToRange(rawKey, outputKey, 5, 10);

        // Value: 0
        // Range size: 6
        // Clamped value: 5 + (0 % 6) = 5
        CHECK(areAllBytesZeroExceptLast(outputKey));
        CHECK(readLastByte(outputKey) == 5);
    }

    SECTION("key with value 1 within [3, 8] range") {
        buildBigEndianPrivateKeyFromUint8(rawKey, 1);
        clampPrivateKeyToRange(rawKey, outputKey, 3, 8);

        // Value: 1
        // Range size: 6
        // Clamped value: 3 + (1 % 6) = 4
        CHECK(areAllBytesZeroExceptLast(outputKey));
        CHECK(readLastByte(outputKey) == 4);
    }

    SECTION("single-value range always produces that value") {
        buildBigEndianPrivateKeyFromUint8(rawKey, 0);
        clampPrivateKeyToRange(rawKey, outputKey, 7, 7);

        // Value: 0
        // Range size: 1
        // Clamped value: 7 + (0 % 1) = 7
        CHECK(areAllBytesZeroExceptLast(outputKey));
        CHECK(readLastByte(outputKey) == 7);

        buildBigEndianPrivateKeyFromUint8(rawKey, 99);
        clampPrivateKeyToRange(rawKey, outputKey, 7, 7);

        // Value: 99
        // Range size: 1
        // Clamped value: 7 + (99 % 1) = 7
        CHECK(areAllBytesZeroExceptLast(outputKey));
        CHECK(readLastByte(outputKey) == 7);
    }

    SECTION("all-0xFF key wraps within range correctly") {
        std::memset(rawKey, 0xFF, 32);
        clampPrivateKeyToRange(rawKey, outputKey, 1, 100);

        // The clamped value must be between 1 and 100
        uint8_t result = readLastByte(outputKey);
        CHECK(result >= 1);
        CHECK(result <= 100);
    }
}

TEST_CASE("clampPrivateKeyToRange: output key differs from raw input after clamping", "[utils][maths]") {
    uint8_t rawKey[32], outputKey[32];
    std::memset(rawKey, 0xFF, 32);

    clampPrivateKeyToRange(rawKey, outputKey, 1, 10);

    // All-0xFF is way outside [1, 10], so the output must differ from the input
    CHECK(std::memcmp(rawKey, outputKey, 32) != 0);
}
