#include "core/hashers/bitcoin/P2TR.hpp"
#include "address.hpp"
#include "core/publicKeysDeriver.hpp"
#include "utils/hex.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <vector>

// Private key 0x01 (1G)
static const char* BITCOIN_P2TR_ADDRESS_FOR_PRIVATE_KEY_1G
    = "da4710964f7852695de2da025290e24af6d8c281de5a0b902b7135fd9fd74d21";
static const uint8_t PRIVATE_KEY_1G[32] = {
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x01,
};

// Private key 0x02 (2G)
static const char* BITCOIN_P2TR_ADDRESS_FOR_PRIVATE_KEY_2G
    = "cafd90c7026f0b6ab98df89490d02732881f2f4b5900856358dddff4679c2ffb";
static const uint8_t PRIVATE_KEY_2G[32] = {
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x02,
};

TEST_CASE("Public key derivation does not throw (P2TR)", "[core][hashers][bitcoin][p2tr]") {
    PublicKeysDeriver deriver;
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_1G));
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_2G));
}

TEST_CASE("Bitcoin P2TR address derivation from private key 0x01 (1G)", "[core][hashers][bitcoin][p2tr]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_1G);

    BitcoinP2TRAddressHasher hasher;
    uint8_t addressBytes[32];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2tr), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 32);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2TR_ADDRESS_FOR_PRIVATE_KEY_1G);
}

TEST_CASE("Bitcoin P2TR address derivation from private key 0x02 (2G)", "[core][hashers][bitcoin][p2tr]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_2G);

    BitcoinP2TRAddressHasher hasher;
    uint8_t addressBytes[32];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2tr), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 32);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2TR_ADDRESS_FOR_PRIVATE_KEY_2G);
}

TEST_CASE("Bitcoin P2TR hasher output size is 32 bytes", "[core][hashers][bitcoin][p2tr]") {
    BitcoinP2TRAddressHasher hasher;
    CHECK(hasher.outputSize() == 32);
}

TEST_CASE("Different private keys produce different P2TR addresses", "[core][hashers][bitcoin][p2tr]") {
    PublicKeysDeriver deriver;
    BitcoinP2TRAddressHasher hasher;

    uint8_t address1[32], address2[32];

    deriver.derive(PRIVATE_KEY_1G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2tr), address1);

    deriver.derive(PRIVATE_KEY_2G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2tr), address2);

    CHECK(std::vector<uint8_t>(address1, address1 + 32) != std::vector<uint8_t>(address2, address2 + 32));
}
