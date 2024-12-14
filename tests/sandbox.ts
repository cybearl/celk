import AddressGenerator from "#kernel/generators/address_generator"

const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC65", {
    enableDebugging: true,
})

addressGenerator.executeInstructions()

console.log("")

addressGenerator.setParams("MEMORY_SLOT::BTC33", {
    enableDebugging: true,
})

addressGenerator.executeInstructions()
