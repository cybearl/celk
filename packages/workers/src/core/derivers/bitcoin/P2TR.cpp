#include "core/derivers/interface.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <secp256k1.h>
#include <secp256k1_extrakeys.h>
#include <stdexcept>

struct BitcoinP2TRAddressDeriver : IAddressDeriver {
    secp256k1_context* ctx;
    uint8_t tweakTagHash[32];

    BitcoinP2TRAddressDeriver() {
        ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN | SECP256K1_CONTEXT_VERIFY);
        std::memcpy(tweakTagHash, tapTweakTagHash(), 32);
    }

    size_t outputSize() const override {
        return 32;
    }

    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override {
        secp256k1_keypair keypair;
        if (!secp256k1_keypair_create(ctx, &keypair, privateKey)) {
            throw std::runtime_error("Failed to create keypair from private key");
        }

        secp256k1_xonly_pubkey xOnlyPublicKey;
        if (!secp256k1_keypair_xonly_pub(ctx, &xOnlyPublicKey, nullptr, &keypair)) {
            throw std::runtime_error("Failed to get x-only public key from keypair");
        }

        uint8_t serializedXOnlyPublicKey[32];
        if (!secp256k1_xonly_pubkey_serialize(ctx, serializedXOnlyPublicKey, &xOnlyPublicKey)) {
            throw std::runtime_error("Failed to serialize x-only public key");
        }

        uint8_t tweakBuffer[96]; // Tap tweak || tap tweak || x-only public key
        std::memcpy(tweakBuffer, tweakTagHash, 32);
        std::memcpy(tweakBuffer + 32, tweakTagHash, 32);
        std::memcpy(tweakBuffer + 64, serializedXOnlyPublicKey, 32);

        uint8_t tweak[32];
        sha256(tweakBuffer, 96, tweak);

        secp256k1_pubkey tweakedPublicKey;
        if (!secp256k1_xonly_pubkey_tweak_add(ctx, &tweakedPublicKey, &xOnlyPublicKey, tweak)) {
            throw std::runtime_error("Failed to tweak x-only public key");
        }

        secp256k1_xonly_pubkey xOnlyTweakedPublicKey;
        if (!secp256k1_xonly_pubkey_from_pubkey(ctx, &xOnlyTweakedPublicKey, nullptr, &tweakedPublicKey)) {
            throw std::runtime_error("Failed to convert tweaked public key to x-only format");
        }

        if (!secp256k1_xonly_pubkey_serialize(ctx, outputData, &xOnlyTweakedPublicKey)) {
            throw std::runtime_error("Failed to serialize tweaked x-only public key");
        }
    }

    ~BitcoinP2TRAddressDeriver() {
        secp256k1_context_destroy(ctx);
    }
};
