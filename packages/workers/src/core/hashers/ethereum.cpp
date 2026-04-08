#include "core/hashers/ethereum.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>

size_t EthereumAddressHasher::outputSize() const {
    return 20;
}

void EthereumAddressHasher::hash(const uint8_t* publicKey, uint8_t* outputData) const {
    // Hash the last 64 bytes of the serialized public key (skip the first byte which is the prefix)
    uint8_t hash[32];
    keccak256(publicKey + 1, 64, hash);

    // The Ethereum address is the last 20 bytes of the hash
    std::memcpy(outputData, hash + 12, 20);
}
