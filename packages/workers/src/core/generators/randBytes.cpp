#include "core/generators/interface.hpp"
#include <cstdint>
#include <openssl/rand.h>

/**
 * @brief Uses OpenSSL `RAND_bytes` to generate a private key via OS-seeded
 * cryptographically secure random byte.
 *
 * Note: Will later be improved with ChaCha20.
 */
struct RandBytesPrivateKeyGenerator : IPrivateKeyGenerator {
    bool next(uint8_t privateKey[32]) override {
        RAND_bytes(privateKey, 32);
        return true;
    }
};
