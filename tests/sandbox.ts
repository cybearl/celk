import AddressGenerator from "#kernel/generators/address_generator"

const addressGenerator = new AddressGenerator({
    instructionSetName: "BTC_BASE58_UNCOMPRESSED",
})

// eslint-disable-next-line no-self-compare, no-constant-condition

addressGenerator.executeInstructions(true)
