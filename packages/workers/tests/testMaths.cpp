#include "utils/hex.hpp"
#include "utils/maths.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <cstring>

/**
 * @brief Reads the last byte of a big-endian 32-byte key buffer.
 * @param key The 32-byte key buffer to read from.
 * @return The value of the last byte (only correct for values that fit in a single byte, i.e. <= 0xFF).
 */
static uint8_t readLastByte(const uint8_t key[32]) {
    return key[31];
}

/**
 * @brief Checks that all bytes except the last are zero in a 32-byte key buffer.
 * @param key The 32-byte key buffer to inspect.
 * @return True if bytes 0-30 are all zero, false otherwise.
 */
static bool allUpperBytesZero(const uint8_t key[32]) {
    for (int i = 0; i < 31; i++) {
        if (key[i] != 0x00) {
            return false;
        }
    }

    return true;
}

/**
 * @brief Builds a 32-byte big-endian private key buffer from a small value.
 * @param out The 32-byte output buffer to write the key into.
 * @param value The value to place in the last byte (all upper bytes are set to zero).
 */
static void makeKey(uint8_t out[32], uint8_t value) {
    std::memset(out, 0x00, 32);
    out[31] = value;
}

TEST_CASE("clampPrivateKeyToRange: output is always within [startRange, endRange]", "[maths]") {
    uint8_t rawKey[32], outKey[32];

    SECTION("all-zero key clamped to start of range") {
        std::memset(rawKey, 0x00, 32);
        clampPrivateKeyToRange(rawKey, outKey, 5, 10);
        // value=0, rangeSize=6, clampedValue = 5 + (0 % 6) = 5
        CHECK(allUpperBytesZero(outKey));
        CHECK(readLastByte(outKey) == 5);
    }

    SECTION("key with value 1 within [3, 8] range") {
        makeKey(rawKey, 1);
        clampPrivateKeyToRange(rawKey, outKey, 3, 8);
        // value=1, rangeSize=6, clampedValue = 3 + (1 % 6) = 4
        CHECK(allUpperBytesZero(outKey));
        CHECK(readLastByte(outKey) == 4);
    }

    SECTION("single-value range always produces that value") {
        makeKey(rawKey, 0);
        clampPrivateKeyToRange(rawKey, outKey, 7, 7);
        CHECK(allUpperBytesZero(outKey));
        CHECK(readLastByte(outKey) == 7);

        makeKey(rawKey, 99);
        clampPrivateKeyToRange(rawKey, outKey, 7, 7);
        CHECK(allUpperBytesZero(outKey));
        CHECK(readLastByte(outKey) == 7);
    }

    SECTION("all-0xFF key wraps within range correctly") {
        std::memset(rawKey, 0xFF, 32);
        clampPrivateKeyToRange(rawKey, outKey, 1, 100);
        // The clamped value must be in [1, 100]
        uint8_t result = readLastByte(outKey);
        CHECK(result >= 1);
        CHECK(result <= 100);
    }
}

TEST_CASE("clampPrivateKeyToRange: output key differs from raw input after clamping", "[maths]") {
    uint8_t rawKey[32], outKey[32];
    std::memset(rawKey, 0xFF, 32);

    clampPrivateKeyToRange(rawKey, outKey, 1, 10);

    // All-0xFF is way outside [1, 10], so the output must differ from the input
    CHECK(std::memcmp(rawKey, outKey, 32) != 0);
}
