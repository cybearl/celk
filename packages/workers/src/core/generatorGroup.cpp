#include "core/generatorGroup.hpp"
#include "core/addressComparator.hpp"
#include "core/constants.hpp"
#include "core/generators/PCG64.hpp"
#include "core/generators/randBytes.hpp"
#include "core/generators/sequential.hpp"
#include "utils/hex.hpp"
#include <memory>
#include <type_traits>

GeneratorGroup::GeneratorGroup(const GeneratorConfig& _config, const TargetAddress& _firstTargetAddress) {
    std::visit(
        [&](auto&& config) {
            using T = std::decay_t<decltype(config)>;

            if constexpr (std::is_same_v<T, RandBytesConfig>) {
                generator = std::make_unique<RandBytesPrivateKeyGenerator>();
            } else if constexpr (std::is_same_v<T, PCG64Config>) {
                generator = std::make_unique<PCG64PrivateKeyGenerator>(config.seed, config.streamId.value_or(0));
            } else if constexpr (std::is_same_v<T, SequentialConfig>) {
                generator = std::make_unique<SequentialPrivateKeyGenerator>(config.startRange.value_or(1),
                    config.endRange.value_or(SECP256K1_ORDER - 1),
                    config.stepSize.value_or(1));
            }
        },
        _config);

    RangeSubGroup& subGroup = _findOrCreateRangeSubGroup(_firstTargetAddress);
    subGroup.targetAddresses.push_back(new TargetAddress(_firstTargetAddress));
    subGroup.requiredAddressTypes.insert(_firstTargetAddress.type);
}

void GeneratorGroup::addTargetAddress(const TargetAddress& targetAddress) {
    RangeSubGroup& subGroup = _findOrCreateRangeSubGroup(targetAddress);
    subGroup.targetAddresses.push_back(new TargetAddress(targetAddress));
    subGroup.requiredAddressTypes.insert(targetAddress.type);
}

void GeneratorGroup::initComparator(const std::vector<TargetAddress*>& targetAddresses) {
    comparator = std::make_unique<AddressComparator>(targetAddresses);
}

std::vector<TargetAddress*> GeneratorGroup::getAllTargetAddresses() const {
    std::vector<TargetAddress*> targetAddresses;

    for (const RangeSubGroup& subGroup : rangeSubGroups) {
        targetAddresses.insert(targetAddresses.end(), subGroup.targetAddresses.begin(), subGroup.targetAddresses.end());
    }

    return targetAddresses;
}

RangeSubGroup& GeneratorGroup::_findOrCreateRangeSubGroup(const TargetAddress& targetAddress) {
    for (RangeSubGroup& subGroup : rangeSubGroups) {
        if (subGroup.rangeStart == targetAddress.startRange && subGroup.rangeEnd == targetAddress.endRange) {
            return subGroup;
        }
    }

    // If no matching subgroup is found, create a new one
    RangeSubGroup newSubGroup;

    newSubGroup.rangeStart = targetAddress.startRange;
    newSubGroup.rangeEnd = targetAddress.endRange;
    rangeSubGroups.push_back(std::move(newSubGroup));

    return rangeSubGroups.back();
}

GeneratorGroup::~GeneratorGroup() {
    for (RangeSubGroup& subGroup : rangeSubGroups) {
        for (TargetAddress* targetAddress : subGroup.targetAddresses) {
            delete targetAddress;
        }
    }
}
