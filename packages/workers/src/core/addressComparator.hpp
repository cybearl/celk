#pragma once

#include "address.hpp"
#include "core/hashers/interface.hpp"
#include <cstdint>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

struct TargetAddress;
struct PublicKeysDeriver;

/**
 * @brief Tracks the closest generated address to a specific target.
 */
struct ClosestMatch {
    std::vector<uint8_t> bytes; // raw bytes of the best candidate so far
    uint8_t score; // number of matching bytes (0-32)
};

/**
 * @brief Compares generated addresses against a set of target addresses,
 * tracking exact matches and the closest match per target.
 */
struct AddressComparator {
    /**
     * @brief One hasher instance per required address type.
     */
    std::unordered_map<AddressType, std::unique_ptr<IAddressHasher>> hashers;

    /**
     * @brief Target addresses indexed by type for fast lookup.
     */
    std::unordered_map<AddressType, std::vector<const TargetAddress*>> targetAddressesByType;

    /**
     * @brief Closest match tracking per target address (key = target value string).
     */
    std::unordered_map<std::string, ClosestMatch> closestMatches;

    /**
     * @brief Reusable hash output buffer (32 bytes covers all address types).
     */
    uint8_t hashBuffer[32];

    /**
     * @brief Constructs the comparator from a list of target addresses.
     * @param targetAddresses The target addresses to compare against.
     */
    explicit AddressComparator(const std::vector<TargetAddress*>& targetAddresses);

    /**
     * @brief Hashes the derived public keys for all required types and compares against all target addresses.
     * @param deriver The deriver holding the current derived public keys.
     * @return The matched target address on exact match, `nullptr` otherwise.
     */
    const TargetAddress* compare(const PublicKeysDeriver& deriver);
};
