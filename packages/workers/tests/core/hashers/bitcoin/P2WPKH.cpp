#include "core/hashers/bitcoin/P2WPKH.hpp"
#include "address.hpp"
#include "core/publicKeysDeriver.hpp"
#include "utils/hex.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <vector>

// Private key 0x01 (1G)
static const char* BITCOIN_P2WPKH_ADDRESS_FOR_PRIVATE_KEY_1G = "751e76e8199196d454941c45d1b3a323f1433bd6";
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
static const char* BITCOIN_P2WPKH_ADDRESS_FOR_PRIVATE_KEY_2G = "06afd46bcdfd22ef94ac122aa11f241244a37ecc";
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

TEST_CASE("Public key derivation does not throw (P2WPKH)", "[core][hashers][bitcoin][p2wpkh]") {
    PublicKeysDeriver deriver;
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_1G));
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_2G));
}

TEST_CASE("Bitcoin P2WPKH address derivation from private key 0x01 (1G)", "[core][hashers][bitcoin][p2wpkh]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_1G);

    BitcoinP2WPKHAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2wpkh), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2WPKH_ADDRESS_FOR_PRIVATE_KEY_1G);
}

TEST_CASE("Bitcoin P2WPKH address derivation from private key 0x02 (2G)", "[core][hashers][bitcoin][p2wpkh]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_2G);

    BitcoinP2WPKHAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2wpkh), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2WPKH_ADDRESS_FOR_PRIVATE_KEY_2G);
}

TEST_CASE("Bitcoin P2WPKH hasher output size is 20 bytes", "[core][hashers][bitcoin][p2wpkh]") {
    BitcoinP2WPKHAddressHasher hasher;
    CHECK(hasher.outputSize() == 20);
}

TEST_CASE("Different private keys produce different P2WPKH addresses", "[core][hashers][bitcoin][p2wpkh]") {
    PublicKeysDeriver deriver;
    BitcoinP2WPKHAddressHasher hasher;

    uint8_t address1[20], address2[20];

    deriver.derive(PRIVATE_KEY_1G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2wpkh), address1);

    deriver.derive(PRIVATE_KEY_2G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2wpkh), address2);

    CHECK(std::vector<uint8_t>(address1, address1 + 20) != std::vector<uint8_t>(address2, address2 + 20));
}
