import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scDynamicConfig, { DYNAMIC_CONFIG_ID } from "@app/db/schema/dynamicConfig"
import scUser from "@app/db/schema/user"
import { db } from "@app/lib/server/connectors/db"
import { and, asc, eq, inArray, sql } from "drizzle-orm"

/**
 * Retrieve the dynamic application config from the database (single row table).
 * @returns The application config object or null if not found.
 */
export async function dbGetDynamicConfig() {
    const [config] = await db.select().from(scDynamicConfig).where(eq(scDynamicConfig.id, DYNAMIC_CONFIG_ID)).limit(1)
    return config
}

/**
 * Retrieve all address lists that are enabled from the database.
 * @returns An array of enabled address lists.
 */
export async function dbGetEnabledAddressLists() {
    const enabledAddressLists = await db
        .select()
        .from(scAddressList)
        .where(eq(scAddressList.isEnabled, true))
        .orderBy(asc(scAddressList.createdAt))

    return enabledAddressLists
}

/**
 * Retrieve all addresses from a specific address list.
 * @param addressListId The ID of the address list to retrieve addresses from.
 * @returns An array of addresses from the specified address list.
 */
export async function dbGetAddressesByAddressListId(addressListId: string) {
    const rows = await db
        .select({ address: scAddress })
        .from(scAddress)
        .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
        .where(eq(scPvtAddressListMember.addressListId, addressListId))

    return rows.map(r => r.address)
}

/**
 * Save the latest dump ID of an address list to the database.
 * @param addressListId The ID of the address list to update.
 * @param latestDumpId The latest dump ID to save.
 */
export async function dbSaveLatestDumpId(addressListId: string, latestDumpId: string) {
    await db.update(scAddressList).set({ latestDumpId }).where(eq(scAddressList.id, addressListId)).execute()
}

/**
 * Increment the attempt counts across the config, the address list and each address
 * in the address list by a certain amount.
 * @param attempts The amount to increment the attempts by (as a numeric).
 * @param addressListId The ID of the address list to update attempts for.
 */
export async function dbIncrementAttemptCounts(attempts: string, addressListId: string) {
    // Using a transaction to ensure all updates succeed or fail together
    await db.transaction(async tx => {
        await Promise.all([
            // Increment global attempts count
            tx
                .update(scDynamicConfig)
                .set({ attempts: sql`${scDynamicConfig.attempts} + ${attempts}::numeric` })
                .where(eq(scDynamicConfig.id, DYNAMIC_CONFIG_ID)),

            // Increment the address list's attempts count
            tx
                .update(scAddressList)
                .set({ attempts: sql`${scAddressList.attempts} + ${attempts}::numeric` })
                .where(eq(scAddressList.id, addressListId)),

            // Increment each address's attempts count via the pivot table
            tx
                .update(scAddress)
                .set({ attempts: sql`${scAddress.attempts} + ${attempts}::numeric` })
                .where(
                    inArray(
                        scAddress.id,
                        tx
                            .select({ id: scPvtAddressListMember.addressId })
                            .from(scPvtAddressListMember)
                            .where(eq(scPvtAddressListMember.addressListId, addressListId)),
                    ),
                ),
        ])
    })
}

/**
 * Retrieve the address list along with the user who created it.
 * @param addressListId The ID of the address list to retrieve.
 * @returns The address list and user information, or null if not found.
 */
export async function dbGetAddressListWithUser(addressListId: string) {
    const [row] = await db
        .select({ addressList: scAddressList, user: scUser })
        .from(scAddressList)
        .innerJoin(scUser, eq(scUser.id, scAddressList.userId))
        .where(eq(scAddressList.id, addressListId))
        .limit(1)

    return row ?? null
}

/**
 * Save a worker match to the database.
 * @param addressListId The ID of the address list to save the match for.
 * @param address The address to save.
 * @param encryptedPrivateKey The encrypted private key to save.
 * @returns The ID of the saved match, or null if not found.
 */
export async function dbSaveWorkerMatchToDb(addressListId: string, address: string, encryptedPrivateKey: string) {
    const [row] = await db
        .select({ id: scAddress.id })
        .from(scAddress)
        .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
        .where(and(eq(scPvtAddressListMember.addressListId, addressListId), eq(scAddress.value, address)))
        .limit(1)

    if (!row) return // address not found, local file is the fallback

    await db.update(scAddress).set({ privateKey: encryptedPrivateKey }).where(eq(scAddress.id, row.id)).execute()
}

/**
 * Disable an address list in the database.
 * @param addressListId The ID of the address list to disable.
 */
export async function dbDisableAddressList(addressListId: string) {
    await db.update(scAddressList).set({ isEnabled: false }).where(eq(scAddressList.id, addressListId)).execute()
}
