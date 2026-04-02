#pragma once

#include <cstdint>

/**
 * Defines the interface for address derivation, implementations of this interface will
 * provide the logic to derive an address from a given private key.
 *
 * The output size of the derived address can be obtained using the `outputSize()` method,
 * and the `derive()` method will perform the actual derivation process.
 */
struct IAddressDeriver {
    virtual size_t outputSize() const = 0;
    virtual void derive(const uint8_t privateKey[32], uint8_t* outputData) const = 0;

    virtual ~IAddressDeriver() = default;
};
