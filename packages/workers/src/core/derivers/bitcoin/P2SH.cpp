#include "core/derivers/interface.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <secp256k1.h>
#include <stdexcept>

struct BitcoinP2SHAddressDeriver : IAddressDeriver {
    secp256k1_context* ctx;

    BitcoinP2SHAddressDeriver() {
        ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
    }

    size_t outputSize() const override {
        return 20;
    }

    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override {
        secp256k1_pubkey pubkey;
        if (!secp256k1_ec_pubkey_create(ctx, &pubkey, privateKey)) {
            throw std::runtime_error("Failed to create public key from private key");
        }

        uint8_t serializedPublicKey[33];
        size_t serializedPublicKeyLen = 33;
        secp256k1_ec_pubkey_serialize(
            ctx, serializedPublicKey, &serializedPublicKeyLen, &pubkey, SECP256K1_EC_COMPRESSED);

        hash160(serializedPublicKey, 33, outputData);

        uint8_t redeemScript[23];
        redeemScript[0] = 0x00; // OP_0
        redeemScript[1] = 0x14; // Push 20 bytes
        std::memcpy(redeemScript + 2, outputData, 20); // Push the hash160 of the public key

        hash160(redeemScript, 22, outputData);
    }

    ~BitcoinP2SHAddressDeriver() {
        secp256k1_context_destroy(ctx);
    }
};
