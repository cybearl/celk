#include "core/derivers/compressed.hpp"
#include <secp256k1.h>
#include <stdexcept>

CompressedPublicKeyDeriver::CompressedPublicKeyDeriver()
    : ctx(secp256k1_context_create(SECP256K1_CONTEXT_SIGN)) { }

size_t CompressedPublicKeyDeriver::outputSize() const {
    return 33; // Compressed public key size
}

void CompressedPublicKeyDeriver::derive(const uint8_t privateKey[32], uint8_t* outputData) const {
    secp256k1_pubkey pubkey;

    if (!secp256k1_ec_pubkey_create(ctx, &pubkey, privateKey)) {
        throw std::runtime_error("Failed to create public key from private key");
    }

    size_t outputLen = 33;
    if (!secp256k1_ec_pubkey_serialize(ctx, outputData, &outputLen, &pubkey, SECP256K1_EC_COMPRESSED)) {
        throw std::runtime_error("Failed to serialize compressed public key");
    }
}

CompressedPublicKeyDeriver::~CompressedPublicKeyDeriver() {
    secp256k1_context_destroy(ctx);
}
