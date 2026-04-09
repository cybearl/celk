#pragma once

#include "core/hashers/interface.hpp"

/**
 * @brief Bitcoin P2SH address hasher implementation.
 */
struct BitcoinP2SHAddressHasher : IAddressHasher {
    size_t outputSize() const override;
    void hash(const uint8_t* publicKey, uint8_t* outputData) const override;
};
