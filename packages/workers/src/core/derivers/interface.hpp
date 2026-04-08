#pragma once

#include <cstdint>

/**
 * @brief Defines the interface for address derivation, implementations of this interface will
 * provide the logic to derive an address from a given private key.
 *
 * The output size of the derived address can be obtained using the `outputSize()` method,
 * and the `derive()` method will perform the actual derivation process.
 */
struct IAddressDeriver {
    /**
     * @brief Returns the output size of the derived address.
     */
    virtual size_t outputSize() const = 0;

    /**
     * @brief Derives an address from the given private key.
     * @param privateKey The 32-byte array containing the private key to derive the address from.
     * @param outputData The array to fill with the derived address, must be at least `outputSize()` bytes long.
     */
    virtual void derive(const uint8_t privateKey[32], uint8_t* outputData) const = 0;

    /**
     * @brief Virtual destructor to ensure proper cleanup of derived classes.
     */
    virtual ~IAddressDeriver() = default;
};
