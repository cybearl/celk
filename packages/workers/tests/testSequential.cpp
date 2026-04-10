#include "core/generators/sequential.hpp"
#include <array>
#include <catch2/catch_test_macros.hpp>
#include <cstdint>

/**
 * @brief Reads the last byte of a big-endian 32-byte private key buffer.
 * @param privateKey The 32-byte private key buffer to read from.
 * @return The value of the last byte (only correct for values that fit in a single byte, i.e. <= 0xFF).
 */
static uint8_t readLastByte(const uint8_t privateKey[32]) {
    return privateKey[31];
}

/**
 * @brief Checks that all bytes except the last are zero in a 32-byte private key buffer.
 * @param privateKey The 32-byte private key buffer to inspect.
 * @return True if bytes 0-30 are all zero, false otherwise.
 */
static bool allUpperBytesZero(const uint8_t privateKey[32]) {
    for (int i = 0; i < 31; i++) {
        if (privateKey[i] != 0x00) {
            return false;
        }
    }

    return true;
}

TEST_CASE("SequentialPrivateKeyGenerator: basic iteration", "[sequential]") {
    uint8_t key[32];

    SECTION("generates values 1 2 3 in order") {
        SequentialPrivateKeyGenerator gen(1, 3);

        CHECK(gen.next(key));
        CHECK(allUpperBytesZero(key));
        CHECK(readLastByte(key) == 1);

        CHECK(gen.next(key));
        CHECK(allUpperBytesZero(key));
        CHECK(readLastByte(key) == 2);

        CHECK(gen.next(key));
        CHECK(allUpperBytesZero(key));
        CHECK(readLastByte(key) == 3);
    }

    SECTION("returns false after range is exhausted") {
        SequentialPrivateKeyGenerator gen(1, 3);

        gen.next(key); // 1
        gen.next(key); // 2
        gen.next(key); // 3
        CHECK(!gen.next(key)); // exhausted
    }

    SECTION("startRange is the first value returned") {
        SequentialPrivateKeyGenerator gen(5, 10);

        CHECK(gen.next(key));
        CHECK(allUpperBytesZero(key));
        CHECK(readLastByte(key) == 5);
    }

    SECTION("endRange is the last value returned") {
        SequentialPrivateKeyGenerator gen(7, 9);

        gen.next(key); // 7
        gen.next(key); // 8

        CHECK(gen.next(key)); // 9, still in range
        CHECK(readLastByte(key) == 9);

        CHECK(!gen.next(key)); // now exhausted
    }
}

TEST_CASE("SequentialPrivateKeyGenerator: step size", "[sequential]") {
    uint8_t key[32];

    SECTION("step size 2 skips even values") {
        SequentialPrivateKeyGenerator gen(1, 10, 2);

        CHECK(gen.next(key));
        CHECK(readLastByte(key) == 1);

        CHECK(gen.next(key));
        CHECK(readLastByte(key) == 3);

        CHECK(gen.next(key));
        CHECK(readLastByte(key) == 5);
    }
}

TEST_CASE("SequentialPrivateKeyGenerator: single-value range", "[sequential]") {
    uint8_t key[32];

    SECTION("generates exactly one value") {
        SequentialPrivateKeyGenerator gen(42, 42);

        CHECK(gen.next(key));
        CHECK(readLastByte(key) == 42);

        CHECK(!gen.next(key));
    }
}

TEST_CASE("SequentialPrivateKeyGenerator: big-endian serialization", "[sequential]") {
    uint8_t key[32];

    SECTION("value 256 occupies bytes 30 and 31") {
        // 256 = 0x0100, so byte 30 = 0x01, byte 31 = 0x00
        SequentialPrivateKeyGenerator gen(256, 256);

        CHECK(gen.next(key));

        for (int i = 0; i < 30; i++) {
            CHECK(key[i] == 0x00);
        }

        CHECK(key[30] == 0x01);
        CHECK(key[31] == 0x00);
    }
}
