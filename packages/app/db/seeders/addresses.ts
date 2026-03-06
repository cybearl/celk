import { PRIVATE_ENV } from "@app/config/env"
import scAddress, { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"
import { db } from "@app/lib/server/connectors/db"

/**
 * Seed base addresses into the database.
 */
export default async function seedAddresses() {
    if (!PRIVATE_ENV.defaultAdmin.username) {
        console.log("Skipping addresses seeding because not all environment variables are set...")
        return
    }

    const defaultAdminUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, PRIVATE_ENV.defaultAdmin.username!),
    })

    if (!defaultAdminUser) {
        console.log("Skipping address seeding because the default admin user was not found in the database...")
        return
    }

    await db
        .insert(scAddress)
        .values([
            {
                name: "Rain Lohmus",
                type: ADDRESS_TYPE.ETHEREUM,
                network: ADDRESS_NETWORK.ETHEREUM,
                value: "0x2B6eD29A95753C3Ad948348e3e7b1A251080Ffb9",
                closestMatch: "0x2B6eD29A95753C3Ad948",
                attempts: 0n,
                isDisabled: false,
                userId: defaultAdminUser.id,
            },
            {
                name: "17VeB-HADGn",
                type: ADDRESS_TYPE.ETHEREUM,
                network: ADDRESS_NETWORK.ETHEREUM,
                value: "17VeBSnvmvqxChtEH1UM1wBGGHDQwHADGn",
                closestMatch: "0x2B6eD29A95753C3Ad948",
                attempts: 0n,
                isDisabled: false,
                userId: defaultAdminUser.id,
            },
        ])
        .onConflictDoNothing({ target: [scAddress.userId, scAddress.value] })
}
