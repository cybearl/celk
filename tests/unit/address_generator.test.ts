import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import AddressGenerator from "#kernel/generators/address_generator"
import { MemorySlot } from "#kernel/utils/instructions"

const FIXED_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000001"

/**
 * Test source(s):
 * - https://www.rfctools.com/bitcoin-address-test-tool/
 */
test.group("address_generator / private key generator / injected private key via address generator", (group) => {
    let addressGenerator: AddressGenerator

    group.each.setup(() => {
        addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33", {
            privateKeyGeneratorOptions: {
                injectedHexPrivateKey: FIXED_PRIVATE_KEY,
            },
        })
    })

    test("It should return the properly injected private key via 'PrivateKeyGenerator._injectedHexPrivateKey' debugging", ({
        expect,
    }) => {
        // const slot = addressGenerator.executeInstruction() as MemorySlot
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(FIXED_PRIVATE_KEY)
    })
})
