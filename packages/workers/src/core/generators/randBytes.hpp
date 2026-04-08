#pragma once

#include "address.hpp"
#include "core/generators/interface.hpp"
#include <cstdint>

/**
 * @brief Uses OpenSSL `RAND_bytes` to generate a private key via OS-seeded
 * cryptographically secure random bytes.
 *
 * Unlike PCG64, this generator is non-deterministic: each key is drawn from true OS entropy,
 * making it impossible to resume or partition across workers. Use it when reproducibility is
 * not a requirement and maximum unpredictability is preferred.
 *
 * Note: Will later be improved with ChaCha20.
 */
struct RandBytesPrivateKeyGenerator : IPrivateKeyGenerator {
    AddressPrivateKeyGenerator getType() const override;
    bool next(uint8_t privateKey[32]) override;
};
