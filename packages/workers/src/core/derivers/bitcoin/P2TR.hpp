#pragma once

#include "core/derivers/interface.hpp"
#include <secp256k1.h>

struct BitcoinP2TRAddressDeriver : IAddressDeriver {
    secp256k1_context* ctx;
    uint8_t tweakTagHash[32];

    BitcoinP2TRAddressDeriver();

    size_t outputSize() const override;
    void derive(const uint8_t privateKey[32], uint8_t* outputData) const override;

    ~BitcoinP2TRAddressDeriver();
};
