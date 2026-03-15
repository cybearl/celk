#pragma once

#include <nlohmann/json.hpp>

/**
 * Note: Should match the address types and networks defined in the app's database schema.
 */

/**
 * @brief The type of an address.
 */
enum class AddressType {
    Ethereum,
    BtcP2pkh, // "1..."   Base58Check
    BtcP2wpkh, // "bc1q..."  Bech32
    BtcP2sh, // "3..."   Base58Check (nested segwit)
    BtcP2tr, // "bc1p..."  Bech32m
};

NLOHMANN_JSON_SERIALIZE_ENUM(AddressType,
    {
        { AddressType::Ethereum, "ethereum" },
        { AddressType::BtcP2pkh, "btc-p2pkh" },
        { AddressType::BtcP2wpkh, "btc-p2wpkh" },
        { AddressType::BtcP2sh, "btc-p2sh" },
        { AddressType::BtcP2tr, "btc-p2tr" },
    })

/**
 * @brief The network an address belongs to.
 */
enum class AddressNetwork {
    Bitcoin,
    Ethereum,
    Polygon,
};

NLOHMANN_JSON_SERIALIZE_ENUM(AddressNetwork,
    {
        { AddressNetwork::Bitcoin, "bitcoin" },
        { AddressNetwork::Ethereum, "ethereum" },
        { AddressNetwork::Polygon, "polygon" },
    })
