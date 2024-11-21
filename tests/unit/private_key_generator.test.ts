import { test } from "@japa/runner"
import PrivateKeyGenerator from "#kernel/generators/private_key_generator"

test.group("private_key_generator", (group) => {
    let privateKeyGenerator: PrivateKeyGenerator

    group.each.setup(() => {
        privateKeyGenerator = new PrivateKeyGenerator()
    })

    test("It should generate a private key and return the memory slot pointing to it", ({ expect }) => {
        const privateKeySlot = privateKeyGenerator.generate()
        expect(privateKeySlot).toBeDefined()
    })

    test("It should refill the pool with new random bytes based on the private key bounds", ({ expect }) => {
        const initialPool = privateKeyGenerator.pool.toHexString()
        privateKeyGenerator.refill()
        const refilledPool = privateKeyGenerator.pool.toHexString()
        expect(refilledPool).not.toBe(initialPool)
    })

    test("It should throw an error if the private key size is less than 1", ({ expect }) => {
        expect(() => new PrivateKeyGenerator({ privateKeySize: 0 })).toThrow()
    })

    test("It should throw an error if the pool size is not a multiple of the private key size", ({ expect }) => {
        expect(() => new PrivateKeyGenerator({ poolSize: 1025 })).toThrow()
    })

    test("It should never generate a private key outside the bounds", ({ expect }) => {
        const testBounds: [bigint, bigint][] = [
            [0n, 1n],
            [0n, 255n],
            [0n, 256n],
            [0n, 1024n],
            [10n, 11n],
            [257n, 0xc174ee4cba4eb8f5cd775be3f071f00056fff5f145151a859a5c1b3899e485n],
        ]

        for (const bounds of testBounds) {
            privateKeyGenerator.setOptions({
                privateKeySize: 64,
                lowerBound: bounds[0],
                upperBound: bounds[1],
                poolSize: 512,
            })

            for (let i = 0; i < 4096; i++) {
                const privateKeySlot = privateKeyGenerator.generate()
                const privateKey = privateKeyGenerator.pool.readBigInt(privateKeySlot.start, privateKeySlot.length)
                expect(privateKey).toBeGreaterThanOrEqual(bounds[0])
                expect(privateKey).toBeLessThanOrEqual(bounds[1])
            }
        }
    })
})
