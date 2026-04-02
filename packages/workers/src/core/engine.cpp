#include "core/engine.hpp"
#include "address.hpp"
#include "core/generators/interface.hpp"
#include "protocol.hpp"
#include <memory>
#include <string>
#include <vector>

struct GeneratorGroup {
    AddressPrivateKeyGenerator selectedGenerator;
    std::unique_ptr<IPrivateKeyGenerator> generator;
    std::vector<TargetAddress*> targetAddresses;

    GeneratorGroup(AddressPrivateKeyGenerator _selectedGenerator, const std::vector<AddressDump>& _addressDumps) {
        //
    }
};
