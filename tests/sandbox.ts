import PrivateKeyGenerator from "#kernel/generators/private_key_generator"

const privateKeyGenerator = new PrivateKeyGenerator({ privateKeySize: 4, upperBound: 65535n })

const listOfTestBounds: [bigint, bigint][] = [[500n, 501n]]

for (const testBounds of listOfTestBounds) {
    privateKeyGenerator.setOptions({
        privateKeySize: 2,
        lowerBound: testBounds[0],
        upperBound: testBounds[1],
    })

    for (let i = 0; i < 1; i++) {
        const privateKeySlot = privateKeyGenerator.generate()
        const privateKey = privateKeyGenerator.privateKey.readBigInt(privateKeySlot.start, privateKeySlot.length, "LE")
        console.log("privateKey", privateKey.toString())

        if (privateKey < testBounds[0] || privateKey > testBounds[1]) {
            throw new Error("Private key out of bounds")
        }
    }
}
