#include "core/hashers/bitcoin/P2SH.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <secp256k1.h>
#include <stdexcept>

size_t BitcoinP2SHAddressHasher::outputSize() const {
    return 20;
}

void BitcoinP2SHAddressHasher::hash(const uint8_t* publicKey, uint8_t* outputData) const {
    hash160(publicKey, 33, outputData);

    uint8_t redeemScript[23];
    redeemScript[0] = 0x00; // OP_0
    redeemScript[1] = 0x14; // Push 20 bytes
    std::memcpy(redeemScript + 2, outputData, 20); // Push the HASH-160 of the public key

    hash160(redeemScript, 22, outputData);
}
