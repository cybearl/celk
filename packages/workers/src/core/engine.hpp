#pragma once

#include "address.hpp"
#include "core/generators/interface.hpp"
#include <address.hpp>
#include <memory>
#include <string>
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
 * @brief Represents a group of target addresses that can be generate
 * by the same private key generator.
 */
struct GeneratorGroup {
    AddressPrivateKeyGenerator selectedGenerator;
    std::unique_ptr<IPrivateKeyGenerator> generator;
    std::vector<TargetAddress*> targetAddresses;
};
