#include "core/generators/randBytes.hpp"
#include <cstdint>
#include <openssl/rand.h>

AddressPrivateKeyGenerator RandBytesPrivateKeyGenerator::getType() const {
    return AddressPrivateKeyGenerator::RandBytes;
}

bool RandBytesPrivateKeyGenerator::next(uint8_t privateKey[32]) {
    RAND_bytes(privateKey, 32);
    return true;
}
