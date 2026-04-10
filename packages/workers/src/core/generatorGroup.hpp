#pragma once

#include "core/addressComparator.hpp"
#include "core/generators/interface.hpp"
#include "protocol.hpp"
#include <cstdint>
#include <memory>
#include <optional>
#include <set>
#include <string>
#include <uint256_t.h>
#include <variant>
#include <vector>

/**
 * @brief Represents a target address containing all needed fields recovered
 * from the address dump file.
 */
struct TargetAddress {
    std::string id;
    AddressType type;
    std::vector<uint8_t> rawBytes;
    std::string value;
    std::optional<uint256_t> startRange;
    std::optional<uint256_t> endRange;
};

/**
 * @brief A struct representing a subgroup of target addresses that share the same range (if specified).
 */
struct RangeSubGroup {
    std::optional<uint256_t> rangeStart;
    std::optional<uint256_t> rangeEnd;
    std::vector<TargetAddress*> targetAddresses;
    std::set<AddressType> requiredAddressTypes;
};

/**
 * @brief A struct representing the configuration that can be passed to a generator group that
 * uses the `RandBytes` private key generator.
 */
struct RandBytesConfig { };

/**
 * @brief A struct representing the configuration that can be passed to a generator group that
 * uses the `PCG64` private key generator.
 */
struct PCG64Config {
    uint64_t seed;
    std::optional<uint64_t> streamId;
};

/**
 * @brief A struct representing the configuration that can be passed to a generator group that
 * uses the `Sequential` private key generator.
 */
struct SequentialConfig {
    std::optional<uint256_t> startRange;
    std::optional<uint256_t> endRange;
    std::optional<uint256_t> stepSize;
};

/**
 * @brief A struct representing the configuration for a generator group, which includes the
 * selected private key generator and its corresponding configuration parameters.
 */
using GeneratorConfig = std::variant<RandBytesConfig, PCG64Config, SequentialConfig>;

/**
 * @brief A struct representing a generator group, which consists of the instance of a private key
 * generator and its associated target addresses (grouped by range).
 */
struct GeneratorGroup {
    /**
     * @brief The instance of the private key generator used by this generator group.
     */
    std::unique_ptr<IPrivateKeyGenerator> generator;

    /**
     * @brief A vector containing all range subgroups of target addresses.
     */
    std::vector<RangeSubGroup> rangeSubGroups;

    /**
     * @brief The comparator for this generator group.
     */
    std::unique_ptr<AddressComparator> comparator;

    /**
     * @brief Constructs a `GeneratorGroup` instance based on the provided configuration and
     * the first target address that is associated with this generator group.
     * @param _config The configuration for the generator group.
     * @param _firstTargetAddress The first target address for the generator group.
     */
    GeneratorGroup(const GeneratorConfig& _config, const TargetAddress& _firstTargetAddress);

    GeneratorGroup(GeneratorGroup&&) = default;
    GeneratorGroup& operator=(GeneratorGroup&&) = default;

    /**
     * @brief Adds a target address to the generator group.
     * @param targetAddress The target address to add.
     */
    void addTargetAddress(const TargetAddress& targetAddress);

    /**
     * @brief Initializes the comparator with the given target addresses.
     * @param targetAddresses The target addresses to compare against.
     */
    void initComparator(const std::vector<TargetAddress*>& targetAddresses);

    /**
     * @brief Collects all target addresses across all range subgroups.
     */
    std::vector<TargetAddress*> getAllTargetAddresses() const;

    ~GeneratorGroup();

private:
    /**
     * @brief A private utility method used to find or create a range subgroup for a target address.
     * @param targetAddress The target address to find or create a subgroup for.
     * @return A reference to the found or newly created range subgroup.
     */
    RangeSubGroup& _findOrCreateRangeSubGroup(const TargetAddress& targetAddress);
};
