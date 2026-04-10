#include <catch2/catch_test_macros.hpp>
#include "core/publicKeysDeriver.hpp"
#include "core/hashers/ethereum.hpp"
#include "utils/hex.hpp"
#include "address.hpp"
#include <cstdint>
#include <vector>

// Known secp256k1/Ethereum test vectors
// These are verifiable via any Ethereum key generation tool or BIP32 reference implementation

// Private key 0x01 (the generator point G itself)
static const uint8_t PRIVKEY_1[32] = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
};

// Expected ETH address for private key 0x01 (checksum-lowercased)
static const char* ETH_ADDR_PRIVKEY_1 = "7e5f4552091a69125d5dfcb7b8c2659029395bdf";

// Private key 0x02 (2G)
static const uint8_t PRIVKEY_2[32] = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
};

// Expected ETH address for private key 0x02
static const char* ETH_ADDR_PRIVKEY_2 = "2b5ad5c4795c026514f8317c7a215e218dccd6cf";

TEST_CASE("Public key derivation does not throw", "[ethereum]") {
    PublicKeysDeriver deriver;
    CHECK_NOTHROW(deriver.derive(PRIVKEY_1));
    CHECK_NOTHROW(deriver.derive(PRIVKEY_2));
}

TEST_CASE("Ethereum address derivation from private key 0x01", "[ethereum]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVKEY_1);

    EthereumAddressHasher hasher;
    uint8_t addrBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), addrBytes);

    auto expected = hexStringToVector(ETH_ADDR_PRIVKEY_1);
    auto actual = std::vector<uint8_t>(addrBytes, addrBytes + 20);

    CHECK(actual == expected);
}

TEST_CASE("Ethereum address derivation from private key 0x02", "[ethereum]") {
    PublicKeysDeriver deriver;
    deriver.derive(PRIVKEY_2);

    EthereumAddressHasher hasher;
    uint8_t addrBytes[20];
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), addrBytes);

    auto expected = hexStringToVector(ETH_ADDR_PRIVKEY_2);
    auto actual = std::vector<uint8_t>(addrBytes, addrBytes + 20);

    CHECK(actual == expected);
}

TEST_CASE("Ethereum hasher output size is 20 bytes", "[ethereum]") {
    EthereumAddressHasher hasher;
    CHECK(hasher.outputSize() == 20);
}

TEST_CASE("Different private keys produce different addresses", "[ethereum]") {
    PublicKeysDeriver deriver;
    EthereumAddressHasher hasher;

    uint8_t addr1[20], addr2[20];

    deriver.derive(PRIVKEY_1);
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), addr1);

    deriver.derive(PRIVKEY_2);
    hasher.hash(deriver.publicKeyFor(AddressType::Ethereum), addr2);

    CHECK(std::vector<uint8_t>(addr1, addr1 + 20) != std::vector<uint8_t>(addr2, addr2 + 20));
}
