#include "core/publicKeysDeriver.hpp"
#include <secp256k1.h>
#include <secp256k1_extrakeys.h>
#include <stdexcept>

PublicKeysDeriver::PublicKeysDeriver()
    : ctx(secp256k1_context_create(SECP256K1_CONTEXT_SIGN)) { }

void PublicKeysDeriver::derive(const uint8_t privateKey[32]) {
    secp256k1_pubkey publicKey;

    if (!secp256k1_ec_pubkey_create(ctx, &publicKey, privateKey)) {
        throw std::runtime_error("Failed to create public key from private key");
    }

    size_t uncompressedLength = 65;
    if (!secp256k1_ec_pubkey_serialize(
            ctx, derivedPublicKeys.uncompressed, &uncompressedLength, &publicKey, SECP256K1_EC_UNCOMPRESSED)) {
        throw std::runtime_error("Failed to serialize uncompressed public key");
    }

    size_t compressedLength = 33;
    if (!secp256k1_ec_pubkey_serialize(
            ctx, derivedPublicKeys.compressed, &compressedLength, &publicKey, SECP256K1_EC_COMPRESSED)) {
        throw std::runtime_error("Failed to serialize compressed public key");
    }

    secp256k1_xonly_pubkey xOnlyPubkey;
    if (!secp256k1_xonly_pubkey_from_pubkey(ctx, &xOnlyPubkey, nullptr, &publicKey)) {
        throw std::runtime_error("Failed to derive x-only public key");
    }

    if (!secp256k1_xonly_pubkey_serialize(ctx, derivedPublicKeys.xOnly, &xOnlyPubkey)) {
        throw std::runtime_error("Failed to serialize x-only public key");
    }
}

const uint8_t* PublicKeysDeriver::publicKeyFor(AddressType addressType) const {
    switch (addressTypeToPublicKeyForm.at(addressType)) {
        case PublicKeyForm::Uncompressed:
            return derivedPublicKeys.uncompressed;
        case PublicKeyForm::Compressed:
            return derivedPublicKeys.compressed;
        case PublicKeyForm::XOnly:
            return derivedPublicKeys.xOnly;
    }
}

PublicKeysDeriver::~PublicKeysDeriver() {
    secp256k1_context_destroy(ctx);
}
