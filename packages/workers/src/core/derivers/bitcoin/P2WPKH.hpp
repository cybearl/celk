#pragma once

#include "core/derivers/interface.hpp"
#include <secp256k1.h>

/**
 * @brief Bitcoin P2WPKH address deriver implementation.
 */
struct BitcoinP2WPKHAddressDeriver : IAddressDeriver {
    /**
     * @brief The secp256k1 context used for cryptographic operations during address derivation.
     */
    secp256k1_context* ctx;

    /**
     * @brief Constructs a new `BitcoinP2WPKHAddressDeriver`.
     */
    BitcoinP2WPKHAddressDeriver();

    size_t outputSize() const override;
    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override;

    ~BitcoinP2WPKHAddressDeriver();
};
