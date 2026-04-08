#include "core/hashers/bitcoin/P2TR.hpp"
#include "core/encoding/hash.hpp"
#include <cstring>
#include <secp256k1.h>
#include <secp256k1_extrakeys.h>
#include <stdexcept>

BitcoinP2TRAddressHasher::BitcoinP2TRAddressHasher()
    : ctx(secp256k1_context_create(SECP256K1_CONTEXT_SIGN | SECP256K1_CONTEXT_VERIFY)) {
    // Write the hash of the TapTweak tag only once
    std::memcpy(tweakTagHash, tapTweakTagHash(), 32);
}

size_t BitcoinP2TRAddressHasher::outputSize() const {
    return 32;
}

void BitcoinP2TRAddressHasher::hash(const uint8_t* xonlyBytes, uint8_t* outputData) const {
    // Reconstruct the struct from the 32 serialized bytes
    secp256k1_xonly_pubkey xOnlyPublicKey;
    secp256k1_xonly_pubkey_parse(ctx, &xOnlyPublicKey, xonlyBytes);

    uint8_t tweakBuffer[96]; // Tap tweak || tap tweak || x-only public key
    std::memcpy(tweakBuffer, tweakTagHash, 32);
    std::memcpy(tweakBuffer + 32, tweakTagHash, 32);
    std::memcpy(tweakBuffer + 64, xonlyBytes, 32);

    uint8_t tweak[32];
    sha256(tweakBuffer, 96, tweak);

    secp256k1_pubkey tweakedPublicKey;
    if (!secp256k1_xonly_pubkey_tweak_add(ctx, &tweakedPublicKey, &xOnlyPublicKey, tweak)) {
        throw std::runtime_error("Failed to tweak x-only public key");
    }

    secp256k1_xonly_pubkey xOnlyTweakedPublicKey;
    if (!secp256k1_xonly_pubkey_from_pubkey(ctx, &xOnlyTweakedPublicKey, nullptr, &tweakedPublicKey)) {
        throw std::runtime_error("Failed to convert tweaked public key to x-only format");
    }

    if (!secp256k1_xonly_pubkey_serialize(ctx, outputData, &xOnlyTweakedPublicKey)) {
        throw std::runtime_error("Failed to serialize tweaked x-only public key");
    }
}

BitcoinP2TRAddressHasher::~BitcoinP2TRAddressHasher() {
    secp256k1_context_destroy(ctx);
}
