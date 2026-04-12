#include "utils/hash.hpp"
#include "utils/hex.hpp"
#include <array>
#include <catch2/catch_test_macros.hpp>
#include <cstdint>

// Empty input as a valid pointer (avoids passing "nullptr" into hash functions)
static const uint8_t EMPTY[1] = { 0x00 };
static const uint8_t ABC[3] = { 0x61, 0x62, 0x63 };

TEST_CASE("sha256", "[utils][hash]") {
    uint8_t output[32];

    SECTION("empty input") {
        CHECK(sha256(EMPTY, 0, output));
        CHECK(bufferToHex(output, 32) == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    }

    SECTION("single byte 0x00") {
        uint8_t in[] = { 0x00 };
        CHECK(sha256(in, 1, output));
        CHECK(bufferToHex(output, 32) == "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d");
    }

    SECTION("'abc' string") {
        CHECK(sha256(ABC, 3, output));
        CHECK(bufferToHex(output, 32) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }
}

TEST_CASE("ripemd160", "[utils][hash]") {
    uint8_t output[20];

    SECTION("empty input") {
        CHECK(ripemd160(EMPTY, 0, output));
        CHECK(bufferToHex(output, 20) == "9c1185a5c5e9fc54612808977ee8f548b2258d31");
    }

    SECTION("'abc' string") {
        CHECK(ripemd160(ABC, 3, output));
        CHECK(bufferToHex(output, 20) == "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc");
    }
}

TEST_CASE("keccak256", "[utils][hash]") {
    uint8_t output[32];

    SECTION("empty input") {
        CHECK(keccak256(EMPTY, 0, output));
        // Keccak256 (not SHA3-256) of empty string
        CHECK(bufferToHex(output, 32) == "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
    }

    SECTION("'abc' string") {
        CHECK(keccak256(ABC, 3, output));
        CHECK(bufferToHex(output, 32) == "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45");
    }
}

TEST_CASE("hash160", "[utils][hash]") {
    uint8_t output[20];

    SECTION("empty input (RIPEMD160(SHA256('')))") {
        CHECK(hash160(EMPTY, 0, output));
        CHECK(bufferToHex(output, 20) == "b472a266d0bd89c13706a4132ccfb16f7c3b9fcb");
    }

    SECTION("'abc' string matches manual RIPEMD160(SHA256(abc))") {
        CHECK(hash160(ABC, 3, output));

        // Verify by composing manually
        uint8_t sha[32];
        sha256(ABC, 3, sha);
        uint8_t expected[20];
        ripemd160(sha, 32, expected);

        CHECK(std::vector<uint8_t>(output, output + 20) == std::vector<uint8_t>(expected, expected + 20));
    }
}
