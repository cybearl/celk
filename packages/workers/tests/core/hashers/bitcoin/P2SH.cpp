#include "core/hashers/bitcoin/P2SH.hpp"
#include "address.hpp"
#include "core/publicKeysDeriver.hpp"
#include "utils/hex.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <vector>

// Private key 0x01 (1G)
static const char* BITCOIN_P2SH_ADDRESS_FOR_PRIVATE_KEY_1G = "bcfeb728b584253d5f3f70bcb780e9ef218a68f4";
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
static const char* BITCOIN_P2SH_ADDRESS_FOR_PRIVATE_KEY_2G = "978a0121f9a24de65a13bab0c43c3a48be074eae";
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

TEST_CASE("Public key derivation does not throw (P2SH)", "[core][hashers][bitcoin][p2sh]") {
    PublicKeysDeriver deriver;
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_1G));
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_2G));
}

TEST_CASE("Bitcoin P2SH address derivation from private key 0x01 (1G)", "[core][hashers][bitcoin][p2sh]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_1G);

    BitcoinP2SHAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2sh), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2SH_ADDRESS_FOR_PRIVATE_KEY_1G);
}

TEST_CASE("Bitcoin P2SH address derivation from private key 0x02 (2G)", "[core][hashers][bitcoin][p2sh]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_2G);

    BitcoinP2SHAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2sh), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == BITCOIN_P2SH_ADDRESS_FOR_PRIVATE_KEY_2G);
}

TEST_CASE("Bitcoin P2SH hasher output size is 20 bytes", "[core][hashers][bitcoin][p2sh]") {
    BitcoinP2SHAddressHasher hasher;
    CHECK(hasher.outputSize() == 20);
}

TEST_CASE("Different private keys produce different P2SH addresses", "[core][hashers][bitcoin][p2sh]") {
    PublicKeysDeriver deriver;
    BitcoinP2SHAddressHasher hasher;

    uint8_t address1[20], address2[20];

    deriver.derive(PRIVATE_KEY_1G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2sh), address1);

    deriver.derive(PRIVATE_KEY_2G);
    hasher.hash(deriver.publicKeyFor(AddressType::BtcP2sh), address2);

    CHECK(std::vector<uint8_t>(address1, address1 + 20) != std::vector<uint8_t>(address2, address2 + 20));
}
