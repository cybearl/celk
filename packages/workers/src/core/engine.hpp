#pragma once

#include "core/generators/interface.hpp"
#include "protocol.hpp"
#include <cstdint>
#include <memory>
#include <optional>
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
    std::optional<uint256_t> startRange;
    std::optional<uint256_t> endRange;
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
 * @brief Represents a group of target addresses that can be generate
 * by the same private key generator.
 */
struct GeneratorGroup {
    std::unique_ptr<IPrivateKeyGenerator> generator;
    std::vector<TargetAddress*> targetAddresses;

    GeneratorGroup(const GeneratorConfig& _config, const std::vector<AddressDump>& _addressDumps);
};
