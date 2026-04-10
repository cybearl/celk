#pragma once

#include "address.hpp"
#include <cstdint>
#include <secp256k1.h>
#include <unordered_map>

/**
 * @brief The available address public key forms (compressed, uncompressed, and x-only).
 */

enum class PublicKeyForm {
    Compressed,
    Uncompressed,
    XOnly,
};

/**
 * @brief A mapping between address types and their corresponding public key forms.
 */
inline const std::unordered_map<AddressType, PublicKeyForm> addressTypeToPublicKeyForm = {
    { AddressType::Ethereum, PublicKeyForm::Uncompressed },
    { AddressType::BtcP2pkh, PublicKeyForm::Compressed },
    { AddressType::BtcP2wpkh, PublicKeyForm::Compressed },
    { AddressType::BtcP2sh, PublicKeyForm::Compressed },
    { AddressType::BtcP2tr, PublicKeyForm::XOnly },
};

/**
 * @brief Holds all three serialized public key forms derived from a single private key.
 */
struct DerivedPublicKeys {
    uint8_t uncompressed[65]; // 04 || x || y
    uint8_t compressed[33]; // 02/03 || x
    uint8_t xOnly[32]; // x (even-y normalized, BIP340)
};

/**
 * @brief Derives all three public key forms from a private key in a single EC operation.
 * The derived keys are stored as members and reused across calls to avoid repeated allocation.
 */
struct PublicKeysDeriver {
    /**
     * @brief The secp256k1 context used for cryptographic operations during derivation.
     */
    secp256k1_context* ctx;

    /**
     * @brief The last derived public keys, written in-place on each call to `derive()`.
     */
    DerivedPublicKeys derivedPublicKeys;

    PublicKeysDeriver();

    /**
     * @brief Derives all three public key forms from the given private key, writing into `derivedPublicKeys`.
     * @param privateKey The 32-byte private key to derive from.
     */
    void derive(const uint8_t privateKey[32]);

    /**
     * @brief Returns a pointer to the public key form required by the given address type.
     * @param addressType The address type to select the public key form for.
     * @return A pointer into `keys` for the corresponding public key bytes.
     */
    const uint8_t* publicKeyFor(AddressType addressType) const;

    ~PublicKeysDeriver();
};
