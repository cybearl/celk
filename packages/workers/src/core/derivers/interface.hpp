#pragma once

#include <cstdint>

/**
 * @brief Defines the interface for public key derivation, implementations of this interface will
 * provide the logic to derive a public key from a given private key.
 *
 * The output size of the derived public key can be obtained using the `outputSize()` method,
 * and the `derive()` method will perform the actual derivation process.
 */
struct IPublicKeyDeriver {
    /**
     * @brief Returns the output size of the derived public key.
     */
    virtual size_t outputSize() const = 0;

    /**
     * @brief Derives a public key from the given private key.
     * @param privateKey The 32-byte array containing the private key to derive the public key from.
     * @param outputData The array to fill with the derived public key, must be at least `outputSize()` bytes long.
     */
    virtual void derive(const uint8_t privateKey[32], uint8_t* outputData) const = 0;

    /**
     * @brief Virtual destructor to ensure proper cleanup of derived classes.
     */
    virtual ~IPublicKeyDeriver() = default;
};
