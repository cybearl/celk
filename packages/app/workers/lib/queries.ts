import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scConfig, { CONFIG_ID } from "@app/db/schema/config"
import scUser from "@app/db/schema/user"
import { db } from "@app/lib/server/connectors/db"
import { and, asc, eq, inArray, sql } from "drizzle-orm"

/**
 * Retrieves the application config from the database (single row table).
 * @returns The application config object or null if not found.
 */
export async function getAppConfig() {
    const [config] = await db.select().from(scConfig).where(eq(scConfig.id, CONFIG_ID)).limit(1)
    return config
}

/**
 * Retrieves all address lists that are enabled from the database.
 * @returns An array of enabled address lists.
 */
export async function getEnabledAddressLists() {
    const enabledAddressLists = await db
        .select()
        .from(scAddressList)
        .where(eq(scAddressList.isEnabled, true))
        .orderBy(asc(scAddressList.createdAt))

    return enabledAddressLists
}

/**
 * Retrieves all addresses from a specific address list.
 * @param addressListId The ID of the address list to retrieve addresses from.
 * @returns An array of addresses from the specified address list.
 */
export async function getAddressesByAddressListId(addressListId: string) {
    const rows = await db
        .select({ address: scAddress })
        .from(scAddress)
        .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
        .where(eq(scPvtAddressListMember.addressListId, addressListId))

    return rows.map(r => r.address)
}

/**
 * Saves the latest dump ID of an address list to the database.
 * @param addressListId The ID of the address list to update.
 * @param latestDumpId The latest dump ID to save.
 */
export async function saveLatestDumpId(addressListId: string, latestDumpId: string) {
    await db.update(scAddressList).set({ latestDumpId }).where(eq(scAddressList.id, addressListId)).execute()
}

/**
 * Updates the attempts count across the config, the address list and each address
 * in the address list.
 * @param attempts The new attempts count to set.
 * @param addressListId The ID of the address list to update attempts for.
 */
export async function updateAttemptsCount(attempts: bigint, addressListId: string) {
    // Using a transaction to ensure all updates succeed or fail together
    await db.transaction(async tx => {
        await Promise.all([
            // Increment global attempts counter
            tx
                .update(scConfig)
                .set({ attempts: sql`${scConfig.attempts} + ${attempts}` })
                .where(eq(scConfig.id, CONFIG_ID)),

            // Increment the address list's attempts counter
            tx
                .update(scAddressList)
                .set({ attempts: sql`${scAddressList.attempts} + ${attempts}` })
                .where(eq(scAddressList.id, addressListId)),

            // Increment each address's attempts counter via the pivot table
            tx
                .update(scAddress)
                .set({ attempts: sql`${scAddress.attempts} + ${attempts}` })
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
 * Retrieves the address list along with the user who created it.
 * @param addressListId The ID of the address list to retrieve.
 * @returns The address list and user information, or null if not found.
 */
export async function getAddressListWithUser(addressListId: string) {
    const [row] = await db
        .select({ addressList: scAddressList, user: scUser })
        .from(scAddressList)
        .innerJoin(scUser, eq(scUser.id, scAddressList.userId))
        .where(eq(scAddressList.id, addressListId))
        .limit(1)

    return row ?? null
}

/**
 * Saves a match to the database.
 * @param addressListId The ID of the address list to save the match for.
 * @param address The address to save.
 * @param encryptedPrivateKey The encrypted private key to save.
 * @returns The ID of the saved match, or null if not found.
 */
export async function saveMatchToDb(addressListId: string, address: string, encryptedPrivateKey: string) {
    const [row] = await db
        .select({ id: scAddress.id })
        .from(scAddress)
        .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
        .where(and(eq(scPvtAddressListMember.addressListId, addressListId), eq(scAddress.value, address)))
        .limit(1)

    if (!row) return // address not found, local file is the fallback

    await db.update(scAddress).set({ privateKey: encryptedPrivateKey }).where(eq(scAddress.id, row.id)).execute()
}
