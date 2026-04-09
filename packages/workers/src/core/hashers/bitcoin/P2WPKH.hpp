#pragma once

#include "core/hashers/interface.hpp"

/**
 * @brief Bitcoin P2WPKH address hasher implementation.
 */
struct BitcoinP2WPKHAddressHasher : IAddressHasher {
    size_t outputSize() const override;
    void hash(const uint8_t* publicKey, uint8_t* outputData) const override;
};
