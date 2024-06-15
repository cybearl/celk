import errorCodes from "#lib/constants/errors"
import { internalError } from "#lib/utils/internal_responses"
import Address from "#models/address"
import Chain from "#models/chain"
import Tag from "#models/tag"
import User from "#models/user"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        const admin = await User.findBy("email", process.env.DEFAULT_ADMIN_EMAIL)
        const btcChain = await Chain.findBy("name", "bitcoin")

        if (!admin) {
            internalError(errorCodes.MISSING_FIELD_FOR_SEEDING, null, "Admin user not found during address seeding.")
            return
        }

        if (!btcChain) {
            internalError(errorCodes.MISSING_FIELD_FOR_SEEDING, null, "Bitcoin chain not found during address seeding.")
            return
        }

        const addresses = await Address.createMany([
            {
                hash: "14zfBQx95CP2iRxUuyouhqJsBzgj9iKt4X",
                bytecode: [],
                balance: 50,
                chainId: btcChain.id,
                userId: admin.id,
            },
            {
                hash: "1GDWUJyvtsyFKNjBvH6hpLE3CdaXx33dxP",
                bytecode: [],
                balance: 25,
                chainId: btcChain.id,
                userId: admin.id,
            },
        ])

        // Link the addresses to their tags using the pivot table
        const btcP2PKH = await Tag.findBy("name", "btcP2PKH")

        if (!btcP2PKH) {
            internalError(
                errorCodes.MISSING_FIELD_FOR_SEEDING,
                null,
                "Bitcoin P2PKH tag not found during address seeding."
            )
            return
        }

        await addresses[0].related("tags").attach([btcP2PKH.id as number])
        await addresses[1].related("tags").attach([btcP2PKH.id as number])
    }
}
