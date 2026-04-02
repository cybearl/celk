#include "core/derivers/ethereum.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <secp256k1.h>
#include <stdexcept>

EthereumAddressDeriver::EthereumAddressDeriver()
    : ctx(secp256k1_context_create(SECP256K1_CONTEXT_SIGN)) { }

size_t EthereumAddressDeriver::outputSize() const {
    return 20;
}

void EthereumAddressDeriver::derive(const uint8_t privateKey[32], uint8_t* outputData) const {
    secp256k1_pubkey pubkey;
    if (!secp256k1_ec_pubkey_create(ctx, &pubkey, privateKey)) {
        throw std::runtime_error("Failed to create public key from private key");
    }

    uint8_t serializedPublicKey[65];
    size_t serializedPublicKeyLen = 65;
    secp256k1_ec_pubkey_serialize(
        ctx, serializedPublicKey, &serializedPublicKeyLen, &pubkey, SECP256K1_EC_UNCOMPRESSED);

    // Hash the last 64 bytes of the serialized public key (skip the first byte which is the prefix)
    uint8_t hash[32];
    keccak256(serializedPublicKey + 1, 64, hash);

    // The Ethereum address is the last 20 bytes of the hash
    std::memcpy(outputData, hash + 12, 20);
}

EthereumAddressDeriver::~EthereumAddressDeriver() {
    secp256k1_context_destroy(ctx);
}
