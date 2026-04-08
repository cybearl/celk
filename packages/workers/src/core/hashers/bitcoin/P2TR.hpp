#pragma once

#include "core/hashers/interface.hpp"
#include <secp256k1.h>

/**
 * @brief Bitcoin P2TR address hasher implementation.
 */
struct BitcoinP2TRAddressHasher : IAddressHasher {
    /**
     * @brief The secp256k1 context used for cryptographic operations during address hashing.
     */
    secp256k1_context* ctx;

    /**
     * @brief The hash of the tweak tag used in the hashing process.
     */
    uint8_t tweakTagHash[32];

    BitcoinP2TRAddressHasher();

    size_t outputSize() const override;
    void hash(const uint8_t* xonlyBytes, uint8_t* outputData) const override;

    ~BitcoinP2TRAddressHasher();
};
