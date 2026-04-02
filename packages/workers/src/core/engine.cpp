#include "core/engine.hpp"
#include "core/constants.hpp"
#include "core/generators/PCG64.hpp"
#include "core/generators/randBytes.hpp"
#include "core/generators/sequential.hpp"
#include "utils/hex.hpp"
#include <memory>
#include <type_traits>

GeneratorGroup::GeneratorGroup(const GeneratorConfig& _config, const std::vector<AddressDump>& _addressDumps) {
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

    // Map address dumps to target addresses while filtering out all addresses that
    // does not have the same generator as the one selected for this generator group
    for (const auto& addressDump : _addressDumps) {
        if (addressDump.privateKeyGenerator == generator->getType()) {
            TargetAddress* targetAddress = new TargetAddress();

            targetAddress->id = addressDump.id;
            targetAddress->type = addressDump.type;
            targetAddress->rawBytes = hexStringToVector(addressDump.preEncoding.value_or(addressDump.value));
            targetAddress->value = addressDump.value;

            targetAddresses.push_back(targetAddress);
        }
    }
}

GeneratorGroup::~GeneratorGroup() {
    for (auto* targetAddress : targetAddresses) {
        delete targetAddress;
    }
}
