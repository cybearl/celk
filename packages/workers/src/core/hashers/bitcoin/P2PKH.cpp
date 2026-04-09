#include "core/hashers/bitcoin/P2PKH.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <secp256k1.h>
#include <stdexcept>

size_t BitcoinP2PKHAddressHasher::outputSize() const {
    return 20;
}

void BitcoinP2PKHAddressHasher::hash(const uint8_t* publicKey, uint8_t* outputData) const {
    hash160(publicKey, 33, outputData);
}
