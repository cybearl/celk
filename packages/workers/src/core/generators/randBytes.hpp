#pragma once

#include "address.hpp"
#include "core/generators/interface.hpp"
#include <cstdint>

/**
 * @brief Uses OpenSSL `RAND_bytes` to generate a private key via OS-seeded
 * cryptographically secure random byte.
 *
 * Note: Will later be improved with ChaCha20.
 */
struct RandBytesPrivateKeyGenerator : IPrivateKeyGenerator {
    AddressPrivateKeyGenerator getType() const override;
    bool next(uint8_t privateKey[32]) override;
};
