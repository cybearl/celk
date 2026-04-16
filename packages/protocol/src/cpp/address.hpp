#pragma once

#include <nlohmann/json.hpp>

/**
 * Note: All changes to the protocol should be reflected on the TypeScript side of the Celk protocol.
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
    Bsc,
};

NLOHMANN_JSON_SERIALIZE_ENUM(AddressNetwork,
    {
        { AddressNetwork::Bitcoin, "bitcoin" },
        { AddressNetwork::Ethereum, "ethereum" },
        { AddressNetwork::Polygon, "polygon" },
        { AddressNetwork::Bsc, "bsc" },
    })

/**
 * @brief The different private key generators available for an address.
 */
enum class AddressPrivateKeyGenerator {
    RandBytes,
    PCG64,
    Sequential,
};

NLOHMANN_JSON_SERIALIZE_ENUM(AddressPrivateKeyGenerator,
    { { AddressPrivateKeyGenerator::RandBytes, "rand-bytes" },
        { AddressPrivateKeyGenerator::PCG64, "pcg64" },
        { AddressPrivateKeyGenerator::Sequential, "sequential" } })
