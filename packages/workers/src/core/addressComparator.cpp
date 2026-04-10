#include "core/addressComparator.hpp"
#include "core/generatorGroup.hpp"
#include "core/hashers/bitcoin/P2PKH.hpp"
#include "core/hashers/bitcoin/P2SH.hpp"
#include "core/hashers/bitcoin/P2TR.hpp"
#include "core/hashers/bitcoin/P2WPKH.hpp"
#include "core/hashers/ethereum.hpp"
#include "core/publicKeysDeriver.hpp"
#include <cstring>

AddressComparator::AddressComparator(const std::vector<TargetAddress*>& targetAddresses) {
    for (const TargetAddress* targetAddress : targetAddresses) {
        targetAddressesByType[targetAddress->type].push_back(targetAddress);
        closestMatches[targetAddress->value] = { {}, 0 };
    }

    for (const auto& [addressType, _] : targetAddressesByType) {
        switch (addressType) {
            case AddressType::Ethereum:
                hashers[addressType] = std::make_unique<EthereumAddressHasher>();
                break;
            case AddressType::BtcP2pkh:
                hashers[addressType] = std::make_unique<BitcoinP2PKHAddressHasher>();
                break;
            case AddressType::BtcP2wpkh:
                hashers[addressType] = std::make_unique<BitcoinP2WPKHAddressHasher>();
                break;
            case AddressType::BtcP2sh:
                hashers[addressType] = std::make_unique<BitcoinP2SHAddressHasher>();
                break;
            case AddressType::BtcP2tr:
                hashers[addressType] = std::make_unique<BitcoinP2TRAddressHasher>();
                break;
        }
    }
}

const TargetAddress* AddressComparator::compare(const PublicKeysDeriver& deriver) {
    for (auto& [addressType, hasher] : hashers) {
        hasher->hash(deriver.publicKeyFor(addressType), hashBuffer);
        const size_t size = hasher->outputSize();

        for (const TargetAddress* targetAddress : targetAddressesByType[addressType]) {
            if (std::memcmp(hashBuffer, targetAddress->rawBytes.data(), size) == 0) {
                // Make sure the closest match is updated
                auto& closestMatch = closestMatches[targetAddress->value];
                closestMatch.score = static_cast<uint8_t>(size);
                closestMatch.bytes.assign(hashBuffer, hashBuffer + size);

                return targetAddress;
            }

            uint8_t score = 0;
            for (size_t i = 0; i < size; ++i) {
                if (hashBuffer[i] == targetAddress->rawBytes[i]) {
                    ++score;
                }
            }

            auto& closestMatch = closestMatches[targetAddress->value];
            if (score > closestMatch.score) {
                closestMatch.score = score;
                closestMatch.bytes.assign(hashBuffer, hashBuffer + size);
            }
        }
    }

    return nullptr;
}
