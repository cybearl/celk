import AddressGenerator from "#kernel/generators/address_generator"

const privateKey = "0000000000000000000000000000000000000000000000000000000000000001"

const addressGenerator = new AddressGenerator("BTC33::P2WSH", {
    injectedHexPrivateKey: privateKey,
    enableDebugging: true,
})

addressGenerator.executeInstructions()
