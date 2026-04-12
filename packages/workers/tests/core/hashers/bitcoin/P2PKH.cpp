#include "core/hashers/bitcoin/P2PKH.hpp"
#include "address.hpp"
#include "core/publicKeysDeriver.hpp"
#include "utils/hex.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <vector>

// Private key 0x01 (1G)
static const char* BITCOIN_P2PKH_ADDRESS_FOR_PRIVATE_KEY_1G = "751e76e8199196d454941c45d1b3a323f1433bd6";
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
static const char* BITCOIN_P2PKH_ADDRESS_FOR_PRIVATE_KEY_2G = "06afd46bcdfd22ef94ac122aa11f241244a37ecc";
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

// Private key (BTC Challenge - Puzzle #12)
static const char* BITCOIN_P2PKH_ADDRESS_FOR_PRIVATE_KEY_BTC_CHALLENGE_12 = "85a1f9ba4da24c24e582d9b891dacbd1b043f971";
static const uint8_t PRIVATE_KEY_BTC_CHALLENGE_12[32] = {
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
    0x0a,
    0x7b,
};

TEST_CASE("Public key derivation does not throw (P2PKH)", "[core][hashers][bitcoin][p2pkh]") {
    PublicKeysDeriver deriver;
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_1G));
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_2G));
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_BTC_CHALLENGE_12));
}

TEST_CASE("Bitcoin P2PKH address derivation from private key 0x01 (1G)", "[core][hashers][bitcoin][p2pkh]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_1G);

    BitcoinP2PKHAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2pkh), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2PKH_ADDRESS_FOR_PRIVATE_KEY_1G);
}

TEST_CASE("Bitcoin P2PKH address derivation from private key 0x02 (2G)", "[core][hashers][bitcoin][p2pkh]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_2G);

    BitcoinP2PKHAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2pkh), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2PKH_ADDRESS_FOR_PRIVATE_KEY_2G);
}

TEST_CASE("Bitcoin P2PKH address derivation from private key (BTC Challenge - Puzzle #12)",
    "[core][hashers][bitcoin][p2pkh]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_BTC_CHALLENGE_12);

    BitcoinP2PKHAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2pkh), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2PKH_ADDRESS_FOR_PRIVATE_KEY_BTC_CHALLENGE_12);
}

TEST_CASE("Bitcoin P2PKH hasher output size is 20 bytes", "[core][hashers][bitcoin][p2pkh]") {
    BitcoinP2PKHAddressHasher hasher;
    CHECK(hasher.outputSize() == 20);
}

TEST_CASE("Different private keys produce different P2PKH addresses", "[core][hashers][bitcoin][p2pkh]") {
    PublicKeysDeriver deriver;
    BitcoinP2PKHAddressHasher hasher;

    uint8_t address1[20], address2[20];

    deriver.derive(PRIVATE_KEY_1G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2pkh), address1);

    deriver.derive(PRIVATE_KEY_2G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2pkh), address2);

    CHECK(std::vector<uint8_t>(address1, address1 + 20) != std::vector<uint8_t>(address2, address2 + 20));
}
