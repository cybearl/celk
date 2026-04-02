#pragma once

#include "core/derivers/interface.hpp"
#include <secp256k1.h>

struct EthereumAddressDeriver : IAddressDeriver {
    secp256k1_context* ctx;

    EthereumAddressDeriver();

    size_t outputSize() const override;
    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override;

    ~EthereumAddressDeriver();
};
