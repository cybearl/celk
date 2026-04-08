#include "core/generatorGroup.hpp"
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

    targetAddresses = { new TargetAddress(_firstTargetAddress) };
}

GeneratorGroup::~GeneratorGroup() {
    for (auto* targetAddress : targetAddresses) {
        delete targetAddress;
    }
}
