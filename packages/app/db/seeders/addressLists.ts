import { PRIVATE_ENV } from "@app/config/env"
import scAddressList, { type AddressListInsertModel } from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import { db } from "@app/lib/server/connectors/db"
import { WORKER_STATUS } from "@app/lib/server/instrumentations/workersManager/protocol"
import dedent from "dedent"

/**
 * Seed base address lists into the database.
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
        "attempts" | "workerStatus" | "userId"
    >[] = [
        {
            name: "Rain Lohmus Cracker",
            description: dedent`An address list for cracking the private key of Rain Lohmus, the founder
                                of the LHV bank who lost his Ethereum wallet private key.`,
            isEnabled: false,
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
            isEnabled: false,
            stopOnFirstMatch: false,
            addressValues: [
                // Sequential - 0x00...01 (Test Only)
                "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
                // Sequential - 0x00...02 (Test Only)
                "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
            ],
        },
    ]

    for (const addressList of addressListsToSeed) {
        const { addressValues, ...addressListData } = addressList

        // Create the address list first
        const createdAddressLists = await db
            .insert(scAddressList)
            .values({
                ...addressListData,
                attempts: "0",
                workerStatus: WORKER_STATUS.Idle,
                userId: defaultAdminUser.id,
            })
            .returning()
            .onConflictDoNothing({ target: [scAddressList.userId, scAddressList.name] })

        if (createdAddressLists.length === 0) {
            // Address list already exists, skip to the next one
            continue
        }

        // Find the address IDs for the given address values
        const addresses = await db.query.addresses.findMany({
            where: (addresses, { inArray }) => inArray(addresses.value, addressValues),
        })

        // Create entries in the address list members pivot table
        await db
            .insert(scPvtAddressListMember)
            .values(
                addresses.map(address => ({
                    addressListId: createdAddressLists[0].id,
                    addressId: address.id,
                })),
            )
            .onConflictDoNothing({ target: [scPvtAddressListMember.addressListId, scPvtAddressListMember.addressId] })
    }
}
