import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import AddressGenerator from "#kernel/generators/address_generator"
import { MemorySlot } from "#kernel/utils/instructions"

const enableDebugging = false
const fixedPrivateKey1 = "0000000000000000000000000000000000000000000000000000000000000001"
const fixedPrivateKey2 = "0000000000000000000000000000000000000000000000000000000000000010"

test.group("address_generator / private key injection for testing", (group) => {
    let addressGenerator: AddressGenerator

    group.each.setup(() => {
        addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33", {
            injectedHexPrivateKey: fixedPrivateKey1,
            enableDebugging: enableDebugging,
        })
    })

    test("It should return the properly injected private key via the 'PrivateKeyGenerator._injectedHexPrivateKey' option", ({
        expect,
    }) => {
        addressGenerator.executeInstruction(0)
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(fixedPrivateKey1)
    })
})

/**
 * Test values sourced from:
 * https://www.rfctools.com/bitcoin-address-test-tool/
 */
test.group("address_generator / memory slot generations", () => {
    test("MEMORY_SLOT::BTC33", ({ expect }) => {
        const randomPrivateKey = "0765E02476F4B84F2E44FE1882B2612A7FE0EAEE62C0C6B11DBCC336A6265852"
        const publicKey = "02B0AE5F7A9955F7CCF6851AF1EB59F5B1AA0C384E525F60A7521770443450160F"
        const sha256 = "6405A9FE83FC3895B698D294D5609F55E8072006FD3E144DB6ECB0DAD6E62D80"
        const ripemd160 = "C51632E43113797078001B20C5A4BC41B7389BFD"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC33", {
            injectedHexPrivateKey: randomPrivateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(randomPrivateKey)
        expect(addressGenerator.cache.readHexString(32, 33)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(65, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(97, 20)).toBe(ripemd160)
    })

    test("MEMORY_SLOT::BTC65", ({ expect }) => {
        const randomPrivateKey = "D17351FB80B81B4780BFB98BF8614179275C784D52B23FA945A6EBD6D8A07D6F"
        const publicKey =
            "04B21B7D3264081687AF835FAF57F04C81CF23170B08266DA36C98F93F156AC9336B74F8B560145E294EB913B21D6860CA5E16B03C34D66799555CD617665551E0"
        const sha256 = "CF34DF803A31B6F2EAB236AD8FEB503FE8CD1416E47303A7A8EC82D69CE7DE49"
        const ripemd160 = "D284DCCB02F91219D792736D92C3C177D9A4D580"

        const addressGenerator = new AddressGenerator("MEMORY_SLOT::BTC65", {
            injectedHexPrivateKey: randomPrivateKey,
            enableDebugging: enableDebugging,
        })

        addressGenerator.executeInstructions()
        expect(addressGenerator.cache.readHexString(0, 32)).toBe(randomPrivateKey)
        expect(addressGenerator.cache.readHexString(32, 65)).toBe(publicKey)
        expect(addressGenerator.cache.readHexString(97, 32)).toBe(sha256)
        expect(addressGenerator.cache.readHexString(129, 20)).toBe(ripemd160)
    })
})
