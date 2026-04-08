#include "core/derivers/uncompressed.hpp"
#include <secp256k1.h>
#include <stdexcept>

UncompressedPublicKeyDeriver::UncompressedPublicKeyDeriver()
    : ctx(secp256k1_context_create(SECP256K1_CONTEXT_SIGN)) { }

size_t UncompressedPublicKeyDeriver::outputSize() const {
    return 65; // Uncompressed public key size
}

void UncompressedPublicKeyDeriver::derive(const uint8_t privateKey[32], uint8_t* outputData) const {
    secp256k1_pubkey pubkey;

    if (!secp256k1_ec_pubkey_create(ctx, &pubkey, privateKey)) {
        throw std::runtime_error("Failed to create public key from private key");
    }

    size_t outputLen = 65;
    if (!secp256k1_ec_pubkey_serialize(ctx, outputData, &outputLen, &pubkey, SECP256K1_EC_UNCOMPRESSED)) {
        throw std::runtime_error("Failed to serialize uncompressed public key");
    }
}

UncompressedPublicKeyDeriver::~UncompressedPublicKeyDeriver() {
    secp256k1_context_destroy(ctx);
}
