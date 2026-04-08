import { PRIVATE_ENV } from "@app/config/env"
import scAddress, {
    ADDRESS_NETWORK,
    ADDRESS_PRIVATE_KEY_GENERATOR,
    ADDRESS_TYPE,
    type AddressInsertModel,
} from "@app/db/schema/address"
import { convertBytesToHexAddress, decodeBitcoinAddress } from "@app/lib/base/utils/addresses"
import { db } from "@app/lib/server/connectors/db"

/**
 * Seeds base addresses into the database.
 */
export default async function seedAddresses() {
    if (!PRIVATE_ENV.defaultAdmin.username) {
        throw new Error("No addresses seeding because not all environment variables are set...")
    }

    const defaultAdminUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, PRIVATE_ENV.defaultAdmin.username!),
    })

    if (!defaultAdminUser) {
        throw new Error("No address seeding because the default admin user was not found in the database...")
    }

    const addressesToSeed: (Omit<
        AddressInsertModel,
        "closestMatch" | "attempts" | "privateKeyRangeStart" | "privateKeyRangeEnd" | "userId"
    > & {
        privateKeyRangeStart?: bigint
        privateKeyRangeEnd?: bigint
    })[] = [
        {
            name: "Rain Lohmus",
            description: "Founder of the LHV bank who lost his Ethereum wallet private key.",
            network: ADDRESS_NETWORK.ETHEREUM,
            type: ADDRESS_TYPE.ETHEREUM,
            value: "0x2B6eD29A95753C3Ad948348e3e7b1A251080Ffb9",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes,
            isDisabled: false,
        },
        {
            name: "17VeB-HADGn",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "17VeBSnvmvqxChtEH1UM1wBGGHDQwHADGn",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes,
            isDisabled: false,
        },
        {
            name: "1MueF-5Dsgv",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "1MueFgEA93yN3gFvMePM7eFfhMUHH5Dsgv",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes,
            isDisabled: false,
        },
        {
            name: "1L1zr-9N92f",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "1L1zrH8xDZxqncomih5tPq7GZcCVa9N92f",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes,
            isDisabled: false,
        },
        {
            name: "bc1q9-dtl6c",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2WPKH,
            value: "bc1q9ny8ykmmqnfwrdh4u8senrt4m8f8swkg4dtl6c",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes,
            isDisabled: false,
        },
        {
            // TEST ONLY:
            // Private key: 0xbf32504673ec05e217f873473261a0adf49a0dfa6dfc785bdac50641a0ff6eff
            name: "34Uzn-N1XWV (Test Only)",
            description: "A Bitcoin P2SH address with a known private key, for testing purposes only.",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2SH,
            value: "34UznXspYv5k5Ke1Zg3F7xnprqnDdN1XWV",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes,
            isDisabled: false,
        },
        {
            name: "BTC Challenge - Puzzle #71",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "1PWo3JeB9jrGwfHDNpdGK54CRas7fsVzXU",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.PCG64,
            privateKeyRangeStart: 0x400000000000000000n,
            privateKeyRangeEnd: 0x7fffffffffffffffffn,
            isDisabled: false,
        },
        {
            name: "BTC Challenge - Puzzle #72",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "1JTK7s9YVYywfm5XUH7RNhHJH1LshCaRFR",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.PCG64,
            privateKeyRangeStart: 0x800000000000000000n,
            privateKeyRangeEnd: 0xffffffffffffffffffn,
            isDisabled: false,
        },
        {
            name: "BTC Challenge - Puzzle #73",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "12VVRNPi4SJqUTsp6FmqDqY5sGosDtysn4",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.PCG64,
            privateKeyRangeStart: 0x1000000000000000000n,
            privateKeyRangeEnd: 0x1ffffffffffffffffffn,
            isDisabled: false,
        },
        {
            name: "BTC Challenge - Puzzle #74",
            network: ADDRESS_NETWORK.BITCOIN,
            type: ADDRESS_TYPE.BTC_P2PKH,
            value: "1FWGcVDK3JGzCC3WtkYetULPszMaK2Jksv",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.PCG64,
            privateKeyRangeStart: 0x2000000000000000000n,
            privateKeyRangeEnd: 0x3ffffffffffffffffffn,
            isDisabled: false,
        },
        {
            // TEST ONLY:
            // Private key: 0x0000000000000000000000000000000000000000000000000000000000000001
            name: "Sequential - 0x00...01 (Test Only)",
            description: "An Ethereum address with a private key starting with 0x00...01, for testing purposes only.",
            network: ADDRESS_NETWORK.ETHEREUM,
            type: ADDRESS_TYPE.ETHEREUM,
            value: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.Sequential,
            privateKeyRangeStart: 0x00n,
            privateKeyRangeEnd: 0xffn,
            isDisabled: false,
        },
        {
            // TEST ONLY:
            // Private key: 0x0000000000000000000000000000000000000000000000000000000000000002
            name: "Sequential - 0x00...02 (Test Only)",
            description: "An Ethereum address with a private key starting with 0x00...02, for testing purposes only.",
            network: ADDRESS_NETWORK.ETHEREUM,
            type: ADDRESS_TYPE.ETHEREUM,
            value: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
            privateKeyGenerator: ADDRESS_PRIVATE_KEY_GENERATOR.Sequential,
            privateKeyRangeStart: 0x00n,
            privateKeyRangeEnd: 0xffn,
            isDisabled: false,
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
        .values(
            addressesToSeed.map(address => ({
                ...address,
                closestMatch: 0,
                attempts: "0",
                privateKeyRangeStart: address.privateKeyRangeStart?.toString(),
                privateKeyRangeEnd: address.privateKeyRangeEnd?.toString(),
                userId: defaultAdminUser.id,
            })),
        )
        .onConflictDoNothing({ target: [scAddress.userId, scAddress.value] })
}
