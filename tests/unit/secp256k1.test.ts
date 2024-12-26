import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import Secp256k1Algorithm from "#kernel/algorithms/secp256k1"
import { MemorySlot } from "#kernel/utils/instructions"

test.group("secp256k1 / generate", (group) => {
    let secp256k1Algorithm: Secp256k1Algorithm
    let cache: Cache

    const privateKey = "0x6F737C2D39B4497F4A2556012F0C20E66608CB5D307555D646CE633425E38436"
    const privateKeySlot: MemorySlot = { start: 0, length: 32, end: 32 }

    group.each.setup(() => {
        secp256k1Algorithm = new Secp256k1Algorithm()
        cache = new Cache(128)
        cache.writeHexString(privateKey, privateKeySlot.start, privateKeySlot.length)
        console.log("P:", cache.readHexString(privateKeySlot.start, privateKeySlot.length))
    })

    test("It should generate a compressed public key", ({ expect }) => {
        const outputSlot = { start: 32, length: 33, end: 65 }

        secp256k1Algorithm.generate("compressed", { cache, ...privateKeySlot }, { cache, ...outputSlot })

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(
            "0356769717DC0F96890CC4E78D4408865B1C3A95AA50E238D2DB7259BBF19A0854"
        )
    })

    test("It should generate an uncompressed public key", ({ expect }) => {
        const outputSlot = { start: 32, length: 65, end: 97 }

        secp256k1Algorithm.generate("uncompressed", { cache, ...privateKeySlot }, { cache, ...outputSlot })

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(
            "0456769717DC0F96890CC4E78D4408865B1C3A95AA50E238D2DB7259BBF19A085480DEAFB56B980DA522C2ADB71C3262B24AD9481B88CCF3917B9BE8BD02C13F25"
        )
    })

    test("It should generate an EVM public key", ({ expect }) => {
        const outputSlot = { start: 32, length: 64, end: 96 }

        secp256k1Algorithm.generate("evm", { cache, ...privateKeySlot }, { cache, ...outputSlot })

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(
            "56769717DC0F96890CC4E78D4408865B1C3A95AA50E238D2DB7259BBF19A085480DEAFB56B980DA522C2ADB71C3262B24AD9481B88CCF3917B9BE8BD02C13F25"
        )
    })
})
