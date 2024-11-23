import PrivateKeyGenerator from "#kernel/generators/private_key_generator"

const generator = new PrivateKeyGenerator({ privateKeySize: 4, upperBound: 65535n })
console.log("privateKey", generator.privateKey.toHexString())

const listOfTestBounds: [bigint, bigint][] = [[0n, 255n]]

for (const testBounds of listOfTestBounds) {
    generator.setOptions({
        privateKeySize: 32,
        lowerBound: testBounds[0],
        upperBound: testBounds[1],
    })

    for (let i = 0; i < 10; i++) {
        generator.generate()
        console.log("privateKey", generator.privateKey.toHexString())
    }
}
