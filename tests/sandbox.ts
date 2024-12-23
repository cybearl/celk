import AddressGenerator from "#kernel/generators/address_generator"
import { InstructionSet } from "#kernel/utils/instructions"

const addressGenerator = new AddressGenerator(InstructionSet.MEMORY_SLOT_BTC_P2TR, {
    enableDebugging: true,
})

addressGenerator.executeInstructions()
