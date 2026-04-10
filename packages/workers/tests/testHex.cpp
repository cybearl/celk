#include "utils/hex.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <vector>

TEST_CASE("hexStringToVector", "[hex]") {
    SECTION("plain hex string") {
        auto result = hexStringToVector("deadbeef");
        CHECK(result == std::vector<uint8_t> { 0xde, 0xad, 0xbe, 0xef });
    }

    SECTION("0x prefix is stripped") {
        auto result = hexStringToVector("0xdeadbeef");
        CHECK(result == std::vector<uint8_t> { 0xde, 0xad, 0xbe, 0xef });
    }

    SECTION("uppercase hex is handled") {
        auto result = hexStringToVector("DEADBEEF");
        CHECK(result == std::vector<uint8_t> { 0xde, 0xad, 0xbe, 0xef });
    }

    SECTION("mixed-case (EIP-55 checksum address style)") {
        auto result = hexStringToVector("0xDeAdBeEf");
        CHECK(result == std::vector<uint8_t> { 0xde, 0xad, 0xbe, 0xef });
    }

    SECTION("empty string") {
        auto result = hexStringToVector("");
        CHECK(result.empty());
    }

    SECTION("0x prefix only") {
        auto result = hexStringToVector("0x");
        CHECK(result.empty());
    }

    SECTION("single byte") {
        auto result = hexStringToVector("ff");
        CHECK(result == std::vector<uint8_t> { 0xff });
    }
}

TEST_CASE("vectorToHexString", "[hex]") {
    SECTION("basic bytes") {
        std::string result = vectorToHexString({ 0xde, 0xad, 0xbe, 0xef });
        CHECK(result == "deadbeef");
    }

    SECTION("output is always lowercase") {
        std::string result = vectorToHexString({ 0xAB, 0xCD, 0xEF });
        CHECK(result == "abcdef");
    }

    SECTION("empty vector") {
        std::string result = vectorToHexString({});
        CHECK(result.empty());
    }

    SECTION("single zero byte") {
        std::string result = vectorToHexString({ 0x00 });
        CHECK(result == "00");
    }
}

TEST_CASE("hex round-trip", "[hex]") {
    SECTION("encode then decode") {
        std::vector<uint8_t> original = { 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef };
        std::string hex = vectorToHexString(original);
        auto decoded = hexStringToVector(hex);
        CHECK(decoded == original);
    }

    SECTION("decode then encode") {
        std::string original = "7e5f4552091a69125d5dfcb7b8c2659029395bdf";
        auto bytes = hexStringToVector(original);
        CHECK(vectorToHexString(bytes) == original);
    }
}
