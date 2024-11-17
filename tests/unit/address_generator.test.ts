import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import AddressGenerator from "#kernel/generators/address_generator"

const FIXED_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000001"

/**
 * Test source(s):
 * - https://www.rfctools.com/bitcoin-address-test-tool/
 */
test.group("address_generator / BTC_P2PKH_UNCOMPRESSED", (group) => {
    let addressGenerator: AddressGenerator

    const fixedPrivateKeyInputCache = new Cache(32).writeHexString(FIXED_PRIVATE_KEY)

    group.each.setup(() => {
        addressGenerator = new AddressGenerator("BTC_P2PKH_UNCOMPRESSED", {
            fixedPrivateKeyInputCache,
        })
    })

    test("It should generate the correct Base58 address based on the fixed private key", ({ expect }) => {
        const result = addressGenerator.executeInstructions()
        expect(result).toBe("1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm")
    })
})

/**
 * Test source(s):
 * - https://www.rfctools.com/bitcoin-address-test-tool/
 */
test.group("address_generator / BTC_P2PKH_COMPRESSED", (group) => {
    let addressGenerator: AddressGenerator

    const fixedPrivateKeyInputCache = new Cache(32).writeHexString(FIXED_PRIVATE_KEY)

    group.each.setup(() => {
        addressGenerator = new AddressGenerator("BTC_P2PKH_COMPRESSED", {
            fixedPrivateKeyInputCache,
        })
    })

    test("It should generate the correct Base58 address based on the fixed private key", ({ expect }) => {
        const result = addressGenerator.executeInstructions()
        expect(result).toBe("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH")
    })
})

/**
 * Test source(s):
 * - https://secretscan.org/Bech32
 */
test.group("address_generator / BTC_BECH32_UNCOMPRESSED", (group) => {
    let addressGenerator: AddressGenerator

    const fixedPrivateKeyInputCache = new Cache(32).writeHexString(FIXED_PRIVATE_KEY)

    group.each.setup(() => {
        addressGenerator = new AddressGenerator("BTC_BECH32_UNCOMPRESSED", {
            fixedPrivateKeyInputCache,
        })
    })

    test("It should generate the correct Base58 address based on the fixed private key", ({ expect }) => {
        const result = addressGenerator.executeInstructions()
        expect(result).toBe("1ipuaqnTNHXGs4V2A4aYVK3RpokvbXbX7")
    })
})
