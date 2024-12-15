import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import AddressGenerator from "#kernel/generators/address_generator"
import { MemorySlot } from "#kernel/utils/instructions"

const FIXED_PRIVATE_KEY_1 = "0000000000000000000000000000000000000000000000000000000000000001"
const FIXED_PRIVATE_KEY_2 = "0000000000000000000000000000000000000000000000000000000000000010"

test.group("address_generator / private key injection for testing", (group) => {
    let addressGenerator: AddressGenerator

    group.each.setup(() => {
        addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33", {
            privateKeyGeneratorOptions: {
                injectedHexPrivateKey: FIXED_PRIVATE_KEY_1,
            },
        })
    })

    test("It should return the properly injected private key via the 'PrivateKeyGenerator._injectedHexPrivateKey' option", ({
        expect,
    }) => {
        // const slot = addressGenerator.executeInstruction() as MemorySlot
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(FIXED_PRIVATE_KEY_1)
    })
})

test.group("address_generator / memory slot generations", (group) => {
    let addressGenerator: AddressGenerator

    test("MEMORY_SLOT::BTC33", ({ expect }) => {})

    test("MEMORY_SLOT::BTC65", ({ expect }) => {})
})
