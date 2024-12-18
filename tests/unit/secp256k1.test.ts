import Cache from "#kernel/utils/cache"
import { test } from "@japa/runner"
import Secp256k1Algorithm from "#kernel/algorithms/secp256k1"
import { MemorySlot } from "#kernel/utils/instructions"

test.group("secp256k1 / generate", (group) => {
    let secp256k1Algorithm: Secp256k1Algorithm
    let cache: Cache

    const privateKey = "0X6F737C2D39B4497F4A2556012F0C20E66608CB5D307555D646CE633425E38436"
    const privateKeySlot: MemorySlot = { start: 0, length: 32, end: 32 }

    group.each.setup(() => {
        secp256k1Algorithm = new Secp256k1Algorithm()
        cache = new Cache(128)
        cache.writeHexString(privateKey, privateKeySlot.start, privateKeySlot.length)
    })

    test("It should generate a compressed public key", ({ expect }) => {
        const outputSlot = { start: 32, length: 33, end: 65 }

        secp256k1Algorithm.generate("compressed", { cache, ...privateKeySlot }, { cache, ...outputSlot })

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(
            "020F02BF4AEC20904275AC36E431ADF2883A6CD30EF982CD882D1E8FC4DAE1377A"
        )
    })

    test("It should generate an uncompressed public key", ({ expect }) => {
        const outputSlot = { start: 32, length: 65, end: 97 }

        secp256k1Algorithm.generate("uncompressed", { cache, ...privateKeySlot }, { cache, ...outputSlot })

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(
            "040F02BF4AEC20904275AC36E431ADF2883A6CD30EF982CD882D1E8FC4DAE1377A85A33CA9E0D8DC777159BE5B9D049B1939F797DDAC4C704B7E93F2FFAA137CD4"
        )
    })

    test("It should generate an EVM public key", ({ expect }) => {
        const outputSlot = { start: 32, length: 64, end: 96 }

        secp256k1Algorithm.generate("evm", { cache, ...privateKeySlot }, { cache, ...outputSlot })

        expect(cache.readHexString(outputSlot.start, outputSlot.length)).toBe(
            "0F02BF4AEC20904275AC36E431ADF2883A6CD30EF982CD882D1E8FC4DAE1377A85A33CA9E0D8DC777159BE5B9D049B1939F797DDAC4C704B7E93F2FFAA137CD4"
        )
    })
})
