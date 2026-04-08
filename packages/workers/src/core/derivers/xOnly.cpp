#include "core/derivers/xOnly.hpp"
#include <secp256k1.h>
#include <secp256k1_extrakeys.h>
#include <stdexcept>

XOnlyPublicKeyDeriver::XOnlyPublicKeyDeriver()
    : ctx(secp256k1_context_create(SECP256K1_CONTEXT_SIGN)) { }

size_t XOnlyPublicKeyDeriver::outputSize() const {
    return 32;
}

void XOnlyPublicKeyDeriver::derive(const uint8_t privateKey[32], uint8_t* outputData) const {
    secp256k1_keypair keypair;
    if (!secp256k1_keypair_create(ctx, &keypair, privateKey)) {
        throw std::runtime_error("Failed to create keypair from private key");
    }

    secp256k1_xonly_pubkey xOnlyPublicKey;
    if (!secp256k1_keypair_xonly_pub(ctx, &xOnlyPublicKey, nullptr, &keypair)) {
        throw std::runtime_error("Failed to get x-only public key from keypair");
    }

    if (!secp256k1_xonly_pubkey_serialize(ctx, outputData, &xOnlyPublicKey)) {
        throw std::runtime_error("Failed to serialize x-only public key");
    }
}

XOnlyPublicKeyDeriver::~XOnlyPublicKeyDeriver() {
    secp256k1_context_destroy(ctx);
}
