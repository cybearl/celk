#include "address.hpp"
#include "core/engine.hpp"
#include "core/generators/interface.hpp"
#include "protocol.hpp"
#include <memory>
#include <string>
#include <vector>

struct GeneratorGroup {
    std::unique_ptr<IPrivateKeyGenerator> generator;
    std::vector<TargetAddress*> targetAddresses;

    GeneratorGroup(AddressPrivateKeyGenerator selectedGenerator, const std::vector<AddressDump>& addressDumps) {
        //
    }
};
