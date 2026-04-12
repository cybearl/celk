#include "core/generators/sequential.hpp"
#include "utils/bytes.hpp"
#include <array>
#include <catch2/catch_test_macros.hpp>
#include <cstdint>

TEST_CASE("Basic iteration", "[sequential]") {
    uint8_t key[32];

    SECTION("generates values 1, 2 and 3 in order") {
        SequentialPrivateKeyGenerator gen(1, 3);

        CHECK(gen.next(key));
        CHECK(areAllBytesZeroExceptLast(key));
        CHECK(readLastByte(key) == 1);

        CHECK(gen.next(key));
        CHECK(areAllBytesZeroExceptLast(key));
        CHECK(readLastByte(key) == 2);

        CHECK(gen.next(key));
        CHECK(areAllBytesZeroExceptLast(key));
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
        CHECK(areAllBytesZeroExceptLast(key));
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
