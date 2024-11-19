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
        privateKeyGenerator.setOptions({
            privateKeySize: 1,
            lowerBound: 0n,
            upperBound: 1n,
            poolSize: 256,
        })

        for (let i = 0; i < 4096; i++) {
            const privateKeySlot = privateKeyGenerator.generate()
            const privateKey = privateKeyGenerator.pool.readBigInt(privateKeySlot.start, privateKeySlot.length)
            expect(privateKey).toBeGreaterThanOrEqual(0n)
            expect(privateKey).toBeLessThanOrEqual(1n)
        }

        privateKeyGenerator.setOptions({
            privateKeySize: 2,
            lowerBound: 0n,
            upperBound: 255n,
            poolSize: 256,
        })

        for (let i = 0; i < 4096; i++) {
            const privateKeySlot = privateKeyGenerator.generate()
            const privateKey = privateKeyGenerator.pool.readBigInt(privateKeySlot.start, privateKeySlot.length)
            expect(privateKey).toBeGreaterThanOrEqual(0n)
            expect(privateKey).toBeLessThanOrEqual(255n)
        }

        privateKeyGenerator.setOptions({
            privateKeySize: 2,
            lowerBound: 0n,
            upperBound: 256n,
            poolSize: 256,
        })

        for (let i = 0; i < 4096; i++) {
            const privateKeySlot = privateKeyGenerator.generate()
            const privateKey = privateKeyGenerator.pool.readBigInt(privateKeySlot.start, privateKeySlot.length)
            expect(privateKey).toBeGreaterThanOrEqual(0n)
            expect(privateKey).toBeLessThanOrEqual(256n)
        }

        privateKeyGenerator.setOptions({
            privateKeySize: 2,
            lowerBound: 128n,
            upperBound: 129n,
            poolSize: 256,
        })

        for (let i = 0; i < 4096; i++) {
            const privateKeySlot = privateKeyGenerator.generate()
            const privateKey = privateKeyGenerator.pool.readBigInt(privateKeySlot.start, privateKeySlot.length)
            expect(privateKey).toBeGreaterThanOrEqual(128n)
            expect(privateKey).toBeLessThanOrEqual(129n)
        }
    })
})
