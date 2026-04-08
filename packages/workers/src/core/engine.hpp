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
