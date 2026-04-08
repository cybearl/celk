#pragma once

#include "core/derivers/interface.hpp"
#include <secp256k1.h>

/**
 * @brief Ethereum address deriver implementation (compatible with all Eth-based chains).
 */
struct EthereumAddressDeriver : IAddressDeriver {
    /**
     * @brief The secp256k1 context used for cryptographic operations during address derivation.
     */
    secp256k1_context* ctx;

    /**
     * @brief Constructs a new `EthereumAddressDeriver`.
     */
    EthereumAddressDeriver();

    size_t outputSize() const override;
    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override;

    ~EthereumAddressDeriver();
};
