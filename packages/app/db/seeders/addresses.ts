import { PRIVATE_ENV } from "@app/config/env"
import scAddress, { ADDRESS_NETWORK, ADDRESS_TYPE, type AddressInsertModel } from "@app/db/schema/address"
import { convertBytesToHexAddress, decodeBitcoinAddress } from "@app/lib/base/utils/addresses"
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

    const addressesToSeed: AddressInsertModel[] = [
        {
            name: "Rain Lohmus",
            network: ADDRESS_NETWORK.ETHEREUM,
            type: ADDRESS_TYPE.ETHEREUM,
            value: "0x2B6eD29A95753C3Ad948348e3e7b1A251080Ffb9",
            attempts: 0n,
            isDisabled: false,
            userId: defaultAdminUser.id,
        },
        {
            name: "17VeB-HADGn",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "17VeBSnvmvqxChtEH1UM1wBGGHDQwHADGn",
            attempts: 0n,
            isDisabled: false,
            userId: defaultAdminUser.id,
        },
        {
            name: "1MueF-5Dsgv",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "1MueFgEA93yN3gFvMePM7eFfhMUHH5Dsgv",
            attempts: 0n,
            isDisabled: false,
            userId: defaultAdminUser.id,
        },
        {
            name: "1L1zr-9N92f",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "1L1zrH8xDZxqncomih5tPq7GZcCVa9N92f",
            attempts: 0n,
            isDisabled: false,
            userId: defaultAdminUser.id,
        },
        {
            name: "bc1q9-dtl6c",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2WPKH,
            value: "bc1q9ny8ykmmqnfwrdh4u8senrt4m8f8swkg4dtl6c",
            attempts: 0n,
            isDisabled: false,
            userId: defaultAdminUser.id,
        },
        {
            name: "bc1p8-5j9kd (Test Only)",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2TR,
            value: "bc1p8e779lz89jzqj82nwjywn632smwnsna2u7rzg9uvmyg8d6twqd7q75j9kd",
            attempts: 0n,
            isDisabled: false,
            userId: defaultAdminUser.id,
        },
        {
            // Private key: bf32504673ec05e217f873473261a0adf49a0dfa6dfc785bdac50641a0ff6eff
            name: "34Uzn-N1XWV (Test Only)",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2SH,
            value: "34UznXspYv5k5Ke1Zg3F7xnprqnDdN1XWV",
            attempts: 0n,
            isDisabled: false,
            userId: defaultAdminUser.id,
        },
    ]

    // Automatically add pre-encoding to all Bitcoin addresses
    for (const address of addressesToSeed) {
        if (address.network === ADDRESS_NETWORK.BITCOIN) {
            const bytes = decodeBitcoinAddress(address.value)
            if (bytes) address.preEncoding = convertBytesToHexAddress(bytes)
        }
    }

    await db
        .insert(scAddress)
        .values(addressesToSeed)
        .onConflictDoNothing({ target: [scAddress.userId, scAddress.value] })
}
