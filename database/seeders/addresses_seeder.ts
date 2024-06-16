import AddressesController from "#controllers/addresses_controller"
import { getAddressType } from "#lib/utils/addresses"
import Address from "#models/address"
import logger from "@adonisjs/core/services/logger"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        const addressesToSeed = [
            "14zfBQx95CP2iRxUuyouhqJsBzgj9iKt4X",
            "1MeUgutKkYiyy6rchnhs52c3y2XdjC9AMp",
            "15CDoDQrMDRnwtLtiMQe2pS3D1YK7Nj5Br",
            // "0x33fcac229f3b10ad0cc1fbd30633e8f09fb3f06d",
        ]

        const addresses = await Address.createMany(
            addressesToSeed.map((addressToSeed) => {
                const type = getAddressType(addressToSeed)

                if (!type) {
                    logger.error(`invalid address type for address ${addressToSeed}`)
                    process.exit(1)
                }

                let chainId: number
                if (type.startsWith("BTC")) {
                    chainId = 0
                } else if (type.startsWith("ETH")) {
                    chainId = 1
                } else {
                    logger.error(`invalid chain id for address ${addressToSeed}`)
                    process.exit(1)
                }

                return {
                    type,
                    hash: addressToSeed,
                    chainId: chainId,
                    userId: 1,
                }
            })
        )

        for (const address of addresses) {
            const addressData = await AddressesController.updateAddressData(address)

            if (addressData) {
                logger.debug(
                    `address ${address.hash} seeded, balance: ${Math.floor(addressData.balance || 0)}, tx count: ${addressData.txCount}, last used at: ${addressData.lastUsedAt}`
                )
            } else {
                logger.error(`failed to seed address ${address.hash}, discarding...`)
                await address.delete()
            }
        }
        console.log("Seeded addresses")
    }
}
