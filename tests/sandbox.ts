import AddressGenerator from "#kernel/generators/address_generator"

const addressGenerator = new AddressGenerator({
    instructionSetName: "BTC_BECH32_UNCOMPRESSED",
})

// eslint-disable-next-line no-self-compare, no-constant-condition
while (true) {
    const test = addressGenerator.executeInstructions() as string
    // console.log(test)
}
