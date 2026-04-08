#include "core/hashers/bitcoin/P2WPKH.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <stdexcept>

size_t BitcoinP2WPKHAddressHasher::outputSize() const {
    return 20;
}

void BitcoinP2WPKHAddressHasher::hash(const uint8_t publicKey[32], uint8_t* outputData) const {
    hash160(publicKey, 32, outputData);
}
