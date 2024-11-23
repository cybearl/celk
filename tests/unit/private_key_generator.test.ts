import { test } from "@japa/runner"
import PrivateKeyGenerator from "#kernel/generators/private_key_generator"
import externalLogger from "#lib/utils/external_logger"

const sep = "    "
test.group("private_key_generator", (group) => {
    let privateKeyGenerator: PrivateKeyGenerator

    group.each.setup(() => {
        privateKeyGenerator = new PrivateKeyGenerator()
    })

    test("It should generate a private key and return the memory slot pointing to it", ({ expect }) => {
        const privateKeySlot = privateKeyGenerator.generate()
        expect(privateKeySlot).toBeDefined()
    })

    test("It should throw an error if the private key size is less than 1", ({ expect }) => {
        expect(() => new PrivateKeyGenerator({ privateKeySize: 0 })).toThrow()
    })

    test("It should never generate a private key outside the bounds", ({ expect }) => {
        const listOfTestBounds: [bigint, bigint][] = [
            [0n, 255n],
            [0n, 1024n],
            [0x225n, 0xc174ee4cba4eb8f5cd775be3f071f00056fff5f145151a859a5c1b3899e500n],
            [
                0xc174ee4cba4eb8f5cd775be3f071f00056fff5f145151a859a5c1b3899e300n,
                0xc174ee4cba4eb8f5cd775be3f071f00056fff5f145151a859a5c1b3899e500n,
            ],
        ]

        for (const testBounds of listOfTestBounds) {
            privateKeyGenerator.setOptions({
                privateKeySize: 32,
                lowerBound: testBounds[0],
                upperBound: testBounds[1],
            })

            for (let i = 0; i < 8192; i++) {
                const privateKeySlot = privateKeyGenerator.generate()
                const privateKey = privateKeyGenerator.privateKey.readBigInt(
                    privateKeySlot.start,
                    privateKeySlot.length,
                    "LE"
                )

                expect(privateKey).toBeGreaterThanOrEqual(testBounds[0])
                expect(privateKey).toBeLessThanOrEqual(testBounds[1])
            }
        }
    })

    // Not really a test, more of a randomness report (using the test title as the final message)
    // test("Randomness report finished", () => {
    //     const lowerBound = 0
    //     const upperBound = 512
    //     const distributionSamples = 512

    //     privateKeyGenerator.setOptions({
    //         privateKeySize: 8,
    //         lowerBound: BigInt(lowerBound),
    //         upperBound: BigInt(upperBound),
    //     })

    //     externalLogger.info(`${sep}Running randomness report for the private key generator:`)
    //     externalLogger.info(
    //         `${sep}- privateKey: ${privateKeyGenerator.privateKey.length.toLocaleString("en-US")} bytes`
    //     )
    //     externalLogger.info(`${sep}- lowerBound: ${lowerBound.toLocaleString("en-US")}`)
    //     externalLogger.info(`${sep}- upperBound: ${upperBound.toLocaleString("en-US")}`)

    //     const keyCounts = new Array(upperBound + 1).fill(0)

    //     for (let i = 0; i < distributionSamples; i++) {
    //         const privateKeySlot = privateKeyGenerator.generate()
    //         const privateKey = Number(
    //             privateKeyGenerator.privateKey.readBigInt(privateKeySlot.start, privateKeySlot.length)
    //         )
    //         keyCounts[privateKey]++
    //     }

    //     const min = Math.min(...keyCounts)
    //     const fMin = min.toLocaleString("en-US")
    //     const valueOfMin = keyCounts.indexOf(min).toLocaleString("en-US")
    //     const percentageOfMin = `${((min / distributionSamples) * 100).toFixed(2)}%`

    //     const max = Math.max(...keyCounts)
    //     const fMax = max.toLocaleString("en-US")
    //     const valueOfMax = keyCounts.indexOf(max).toLocaleString("en-US")
    //     const percentageOfMax = `${((max / distributionSamples) * 100).toFixed(2)}%`

    //     const average = keyCounts.reduce((a, b) => a + b) / keyCounts.length
    //     const variance = keyCounts.reduce((a, b) => a + (b - average) ** 2) / keyCounts.length
    //     const standardDeviation = Math.round(Math.sqrt(variance)).toLocaleString("en-US")

    //     externalLogger.info(`${sep}- Distribution samples: ${distributionSamples.toLocaleString("en-US")}`)
    //     externalLogger.info(`${sep}- Distribution min: ${fMin} (value: ${valueOfMin}, percentage: ${percentageOfMin})`)
    //     externalLogger.info(`${sep}- Distribution max: ${fMax} (value: ${valueOfMax}, percentage: ${percentageOfMax})`)
    //     externalLogger.info(`${sep}- Distribution average: ${Math.round(average).toLocaleString("en-US")}`)
    //     externalLogger.info(`${sep}- Distribution variance: ${Math.round(variance).toLocaleString("en-US")}`)
    //     externalLogger.info(`${sep}- Distribution standard deviation: ${standardDeviation}`)

    //     console.log(JSON.stringify(keyCounts))
    // })
})
