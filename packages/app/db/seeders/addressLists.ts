import { PRIVATE_ENV } from "@app/config/env"
import scAddressList, { type AddressListInsertModel } from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import { db } from "@app/lib/server/connectors/db"
import dedent from "dedent"

/**
 * Seeds base address lists into the database.
 */
export default async function seedAddressLists() {
    if (!PRIVATE_ENV.defaultAdmin.username) {
        throw new Error("No addresses seeding because not all environment variables are set...")
    }

    const defaultAdminUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, PRIVATE_ENV.defaultAdmin.username!),
    })

    if (!defaultAdminUser) {
        throw new Error("No address seeding because the default admin user was not found in the database...")
    }

    // Also include address values to automatically create entries inside the address list members pivot table
    const addressListsToSeed: Omit<
        AddressListInsertModel & { addressValues: string[] },
        "attempts" | "averageHashRate" | "isEnabled" | "userId"
    >[] = [
        {
            name: "Rain Lohmus Cracker",
            description: dedent`An address list for cracking the private key of Rain Lohmus, the founder
                                of the LHV bank who lost his Ethereum wallet private key.`,
            stopOnFirstMatch: true,
            addressValues: [
                // Rain Lohmus
                "0x2B6eD29A95753C3Ad948348e3e7b1A251080Ffb9",
            ],
        },
        {
            name: "Sequential Test Cracker",
            description: dedent`An address list for testing sequential private key generation,
                                which includes addresses with consecutive private keys.`,
            stopOnFirstMatch: false,
            addressValues: [
                // Sequential - 0x00...01 (Test Only)
                "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
                // Sequential - 0x00...02 (Test Only)
                "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
            ],
        },
        {
            name: "Bitcoin Challenge",
            description: dedent`An address list containing Bitcoin addresses from the famous
                                Bitcoin challenge puzzle where someone put Bitcoins on many
                                addresses made from private keys with a specific range each
                                time, the goal is to see the immensity of the secp256k1 range.`,
            stopOnFirstMatch: true,
            addressValues: [
                // BTC Challenge - Puzzle #12
                "1DBaumZxUkM4qMQRt2LVWyFJq5kDtSZQot",
                // BTC Challenge - Puzzle #71
                "1PWo3JeB9jrGwfHDNpdGK54CRas7fsVzXU",
                // BTC Challenge - Puzzle #72
                "1JTK7s9YVYywfm5XUH7RNhHJH1LshCaRFR",
                // BTC Challenge - Puzzle #73
                "12VVRNPi4SJqUTsp6FmqDqY5sGosDtysn4",
                // BTC Challenge - Puzzle #74
                "1FWGcVDK3JGzCC3WtkYetULPszMaK2Jksv",
            ],
        },
    ]

    for (const addressList of addressListsToSeed) {
        const { addressValues, ...addressListData } = addressList

        // Create the address list, or look up the existing one if it already exists
        const [createdAddressList] = await db
            .insert(scAddressList)
            .values({
                ...addressListData,
                attempts: "0",
                averageHashRate: 0,
                isEnabled: false,
                userId: defaultAdminUser.id,
            })
            .returning()
            .onConflictDoNothing({ target: [scAddressList.userId, scAddressList.name] })

        const addressListId =
            createdAddressList?.id ??
            (
                await db.query.address_lists.findFirst({
                    columns: { id: true },
                    where: (currentAddressList, { and, eq }) =>
                        and(
                            eq(currentAddressList.userId, defaultAdminUser.id),
                            eq(currentAddressList.name, addressList.name),
                        ),
                })
            )?.id

        if (!addressListId) continue

        // Find the address IDs for the given address values
        const addresses = await db.query.addresses.findMany({
            where: (addresses, { inArray }) => inArray(addresses.value, addressValues),
        })

        if (addresses.length === 0) continue

        // Create entries in the address list members pivot table (idempotent)
        await db
            .insert(scPvtAddressListMember)
            .values(
                addresses.map(address => ({
                    addressListId,
                    addressId: address.id,
                })),
            )
            .onConflictDoNothing({ target: [scPvtAddressListMember.addressListId, scPvtAddressListMember.addressId] })
    }
}
