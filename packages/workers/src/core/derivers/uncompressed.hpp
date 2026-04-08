#pragma once

#include "core/derivers/interface.hpp"
#include <secp256k1.h>

/**
 * @brief Uncompressed public key deriver implementation.
 */
struct UncompressedPublicKeyDeriver : IPublicKeyDeriver {
    /**
     * @brief The secp256k1 context used for cryptographic operations during derivation.
     */
    secp256k1_context* ctx;

    UncompressedPublicKeyDeriver();

    size_t outputSize() const override;
    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override;

    ~UncompressedPublicKeyDeriver();
};
