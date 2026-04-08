#pragma once

#include "core/generatorGroup.hpp"
#include <vector>

// Map address dumps to target addresses while filtering out all addresses that
// does not have the same generator as the one selected for this generator group
// for (const auto& addressDump : _addressDumps) {
//    if (addressDump.privateKeyGenerator == generator->getType()) {
//        TargetAddress* targetAddress = new TargetAddress();

//        targetAddress->id = addressDump.id;
//        targetAddress->type = addressDump.type;
//        targetAddress->rawBytes = hexStringToVector(addressDump.preEncoding.value_or(addressDump.value));
//        targetAddress->value = addressDump.value;

//        targetAddresses.push_back(targetAddress);
//    }
//}

// Basically, what the engine will do is:
// - Go through address dumps
// - For each address dump, it will check if there's a generator group instantiated inside a vector?
// - If there's is, call addTargetAddress with the new target address
// - Otherwise, it will create a new generator group and add the first target address to it
//
// For the run function, in parallel per generator group, it will:
// - Generate a private key via generatorGroup::generator
// - Convert the generated private key into X public keys via the derivers (since secp256k1 params vary depending on the
// address types)
// - Then, for each

struct Engine {
    std::vector<GeneratorGroup> generatorGroups;
};
