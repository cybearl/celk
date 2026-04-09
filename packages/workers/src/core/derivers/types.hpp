#pragma once

#include "address.hpp"
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
