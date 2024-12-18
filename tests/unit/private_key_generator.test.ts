import { test } from "@japa/runner"
import PrivateKeyGenerator from "#kernel/generators/private_key_generator"
import externalLogger from "#lib/utils/external_logger"
import Cache from "#kernel/utils/cache"

const sep = "    "

test.group("private_key_generator", (group) => {
    let cache: Cache
    let privateKeyGenerator: PrivateKeyGenerator

    group.each.setup(() => {
        cache = new Cache(32)
        privateKeyGenerator = new PrivateKeyGenerator({ cache })
    })

    test("It should generate a private key and return the memory slot pointing to it", ({ expect }) => {
        privateKeyGenerator.generate()

        const privateKey = cache.readBigInt(0, 32, "LE")
        expect(privateKey).toBeGreaterThanOrEqual(0n)
    })

    test("It should throw an error if the lower bound is less than 0", ({ expect }) => {
        expect(() => privateKeyGenerator.setOptions({ lowerBound: -1n })).toThrow()
    })

    test("It should throw an error if the upper bound is less than 1", ({ expect }) => {
        expect(() => privateKeyGenerator.setOptions({ upperBound: 0n })).toThrow()
    })

    test("It should throw an error if the upper bound is equal or less than the lower bound", ({ expect }) => {
        expect(() => privateKeyGenerator.setOptions({ lowerBound: 1n, upperBound: 1n })).toThrow()
        expect(() => privateKeyGenerator.setOptions({ lowerBound: 1n, upperBound: 0n })).toThrow()
    })

    test("It should throw an error if the upper bound is greater than the maximum possible value", ({ expect }) => {
        const testCache = new Cache(4)
        privateKeyGenerator.setCacheInstanceWithSlot({ cache: testCache })
        expect(() => privateKeyGenerator.setOptions({ upperBound: 4_294_967_296n })).toThrow()
    })

    test("It should never generate a private key outside the bounds if the space is wide enough", ({ expect }) => {
        const listOfTestBounds: [bigint, bigint][] = [
            [0n, 255n],
            [0n, 1024n],
            [0x225n, 0xc174ee4cba4eb8f5cd775be3f071f00056fff5f145151a859a5c1b3899e500n],
        ]

        for (const testBounds of listOfTestBounds) {
            privateKeyGenerator.setOptions({
                lowerBound: testBounds[0],
                upperBound: testBounds[1],
                throwOnMaxRejections: false,
            })

            for (let i = 0; i < 8192; i++) {
                privateKeyGenerator.generate()

                const privateKey = cache.readBigInt(0, 32, "LE")
                expect(privateKey).toBeGreaterThanOrEqual(testBounds[0])
                expect(privateKey).toBeLessThanOrEqual(testBounds[1])
            }
        }
    })

    // Not really a test, more of a randomness report (using the test title as the final message)
    test("Randomness report finished", () => {
        const lowerBound = 0
        const upperBound = 255
        const distributionSamples = 100_000

        privateKeyGenerator.setOptions({
            lowerBound: BigInt(lowerBound),
            upperBound: BigInt(upperBound),
            maxRejections: -1,
        })

        externalLogger.info(`${sep}Running randomness report for the private key generator:`)
        externalLogger.info(`${sep}- privateKey: ${cache.length.toLocaleString("en-US")} bytes`)
        externalLogger.info(`${sep}- lowerBound: ${lowerBound.toLocaleString("en-US")}`)
        externalLogger.info(`${sep}- upperBound: ${upperBound.toLocaleString("en-US")}`)

        const frequencies = new Array(upperBound + 1).fill(0)

        for (let i = 0; i < distributionSamples; i++) {
            privateKeyGenerator.generate()
            const privateKey = Number(cache.readBigInt(0, 32))

            frequencies[privateKey]++
        }

        const min = Math.min(...frequencies)
        const fMin = min.toLocaleString("en-US")
        const valueOfMin = frequencies.indexOf(min).toLocaleString("en-US")
        const percentageOfMin = `${((min / distributionSamples) * 100).toFixed(2)}%`

        const max = Math.max(...frequencies)
        const fMax = max.toLocaleString("en-US")
        const valueOfMax = frequencies.indexOf(max).toLocaleString("en-US")
        const percentageOfMax = `${((max / distributionSamples) * 100).toFixed(2)}%`

        const total = frequencies.reduce((sum, count) => sum + count, 0)
        const average = frequencies.reduce((sum, count, value) => sum + value * count, 0) / total
        const variance = frequencies.reduce((sum, count, value) => sum + count * (value - average) ** 2, 0) / total
        const standardDeviation = Math.round(Math.sqrt(variance)).toLocaleString("en-US")

        externalLogger.info(`${sep}- Number of distribution samples: ${distributionSamples.toLocaleString("en-US")}`)
        externalLogger.info(`${sep}- Lowest frequency: ${fMin} (value: ${valueOfMin}, percentage: ${percentageOfMin})`)
        externalLogger.info(`${sep}- Highest frequency: ${fMax} (value: ${valueOfMax}, percentage: ${percentageOfMax})`)
        externalLogger.info(`${sep}- Distribution average: ${Math.round(average).toLocaleString("en-US")}`)
        externalLogger.info(`${sep}- Distribution variance: ${Math.round(variance).toLocaleString("en-US")}`)
        externalLogger.info(`${sep}- Distribution standard deviation: ${standardDeviation}`)
    })
})
