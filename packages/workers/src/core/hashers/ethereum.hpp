#pragma once

#include "core/hashers/interface.hpp"

/**
 * @brief Ethereum address hasher implementation (compatible with all Eth-based chains).
 */
struct EthereumAddressHasher : IAddressHasher {
    size_t outputSize() const override;
    void hash(const uint8_t* publicKey, uint8_t* outputData) const override;
};
