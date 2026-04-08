#pragma once

#include "core/derivers/interface.hpp"
#include <secp256k1.h>

/**
 * @brief Bitcoin P2TR address deriver implementation.
 */
struct BitcoinP2TRAddressDeriver : IAddressDeriver {
    /**
     * @brief The secp256k1 context used for cryptographic operations during address derivation.
     */
    secp256k1_context* ctx;

    /**
     * @brief The hash of the tweak tag used in the derivation process.
     */
    uint8_t tweakTagHash[32];

    /**
     * @brief Constructs a new `BitcoinP2TRAddressDeriver`.
     */
    BitcoinP2TRAddressDeriver();

    size_t outputSize() const override;
    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override;

    ~BitcoinP2TRAddressDeriver();
};
