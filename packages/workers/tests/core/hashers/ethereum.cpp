#include "core/hashers/ethereum.hpp"
#include "address.hpp"
#include "core/publicKeysDeriver.hpp"
#include "utils/hex.hpp"
#include <catch2/catch_test_macros.hpp>
#include <cstdint>
#include <vector>

// Private key 0x01 (1G)
static const char* ETHEREUM_ADDRESS_FOR_PRIVATE_KEY_1G = "7e5f4552091a69125d5dfcb7b8c2659029395bdf";
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
static const char* ETHEREUM_ADDRESS_FOR_PRIVATE_KEY_2G = "2b5ad5c4795c026514f8317c7a215e218dccd6cf";
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

TEST_CASE("Public key derivation does not throw", "[core][hashers][ethereum]") {
    PublicKeysDeriver deriver;
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_1G));
    CHECK_NOTHROW(deriver.derive(PRIVATE_KEY_2G));
}

TEST_CASE("Ethereum address derivation from private key 0x01 (1G)", "[core][hashers][ethereum]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_1G);

    EthereumAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == ETHEREUM_ADDRESS_FOR_PRIVATE_KEY_1G);
}

TEST_CASE("Ethereum address derivation from private key 0x02 (2G)", "[core][hashers][ethereum]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVATE_KEY_2G);

    EthereumAddressHasher hasher;
    uint8_t addressBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), addressBytes);

    auto actual = std::vector<uint8_t>(addressBytes, addressBytes + 20);
    auto actualHexString = vectorToHexString(actual);

    CHECK(actualHexString == ETHEREUM_ADDRESS_FOR_PRIVATE_KEY_2G);
}

TEST_CASE("Ethereum hasher output size is 20 bytes", "[core][hashers][ethereum]") {
    EthereumAddressHasher hasher;
    CHECK(hasher.outputSize() == 20);
}

TEST_CASE("Different private keys produce different addresses", "[core][hashers][ethereum]") {
    PublicKeysDeriver deriver;
    EthereumAddressHasher hasher;

    uint8_t address1[20], address2[20];

    deriver.derive(PRIVATE_KEY_1G);
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), address1);

    deriver.derive(PRIVATE_KEY_2G);
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), address2);

    CHECK(std::vector<uint8_t>(address1, address1 + 20) != std::vector<uint8_t>(address2, address2 + 20));
}
