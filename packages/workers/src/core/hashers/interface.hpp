#pragma once

#include <cstdint>

/**
 * @brief Defines the interface for address hashing, implementations of this interface will
 * provide the logic to hash a public key into the raw bytes of a derived address.
 *
 * The output size of the hashed address can be obtained using the `outputSize()` method,
 * and the `hash()` method will perform the actual hashing process.
 */
struct IAddressHasher {
    /**
     * @brief Returns the output size of the hashed address.
     */
    virtual size_t outputSize() const = 0;

    /**
     * @brief Hashes a public key into the raw bytes of a derived address.
     * @param publicKey The array containing the serialized public key to hash,
     * the expected size depends on the associated `IPublicKeyDeriver` (33 bytes for compressed,
     * 65 bytes for uncompressed, 32 bytes for x-only).
     * @param outputData The array to fill with the raw bytes of the hashed address,
     * must be at least `outputSize()` bytes long.
     */
    virtual void hash(const uint8_t* publicKey, uint8_t* outputData) const = 0;

    /**
     * @brief Virtual destructor to ensure proper cleanup of derived classes.
     */
    virtual ~IAddressHasher() = default;
};
