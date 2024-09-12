import { getAddressType } from "#lib/utils/addresses"
import Address from "#models/address"
import logger from "@adonisjs/core/services/logger"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

/**
 * The type of an address to seed.
 */
type AddressToSeed = {
    name: string
    hash: string
    chainId: number
}

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        const addressesToSeed: AddressToSeed[] = [
            {
                name: "Random Bitcoin Address (base58)",
                hash: "14zfBQx95CP2iRxUuyouhqJsBzgj9iKt4X",
                chainId: 0,
            },
            {
                name: "Random Bitcoin Address (base58)",
                hash: "1MeUgutKkYiyy6rchnhs52c3y2XdjC9AMp",
                chainId: 0,
            },
            {
                name: "Random Bitcoin Address (base58)",
                hash: "15CDoDQrMDRnwtLtiMQe2pS3D1YK7Nj5Br",
                chainId: 0,
            },
            {
                name: "Test Bech32 address for bytecode recovery",
                hash: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                chainId: 0,
            },
            {
                name: "Test Base58 address for bytecode recovery",
                hash: "1PMycacnJaSqwwJqjawXBErnLsZ7RkXUAs",
                chainId: 0,
            },
            {
                name: "Random Ethereum Address",
                hash: "0x33fcac229f3b10ad0cc1fbd30633e8f09fb3f06d",
                chainId: 1,
            },
        ]

        await Address.createMany(
            addressesToSeed.map((addressToSeed) => {
                const type = getAddressType(addressToSeed.hash)

                if (!type) {
                    logger.error(`invalid address type for address ${addressToSeed.hash} (${addressToSeed.name})`)
                    process.exit(1)
                }

                return {
                    name: addressToSeed.name,
                    type,
                    hash: addressToSeed.hash,
                    chainId: addressToSeed.chainId,
                    userId: 1,
                }
            })
        )
    }
}
