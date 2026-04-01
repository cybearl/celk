#include "core/derivers/interface.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <secp256k1.h>
#include <stdexcept>

struct BitcoinP2PKHAddressDeriver : IAddressDeriver {
    secp256k1_context* ctx;

    BitcoinP2PKHAddressDeriver() {
        ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
    }

    size_t outputSize() const override {
        return 20;
    }

    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override {
        secp256k1_pubkey publicKey;
        if (!secp256k1_ec_pubkey_create(ctx, &publicKey, privateKey)) {
            throw std::runtime_error("Failed to create public key from private key");
        }

        uint8_t serializedPublicKey[33];
        size_t serializedPublicKeyLen = 33;
        secp256k1_ec_pubkey_serialize(
            ctx, serializedPublicKey, &serializedPublicKeyLen, &publicKey, SECP256K1_EC_COMPRESSED);

        hash160(serializedPublicKey, 33, outputData);
    }

    ~BitcoinP2PKHAddressDeriver() {
        secp256k1_context_destroy(ctx);
    }
};
