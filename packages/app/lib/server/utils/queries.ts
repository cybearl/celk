import scAddress from "@app/db/schema/address"
import scAddressList, { type AddressListInsertModel } from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scDynamicConfig, { DYNAMIC_CONFIG_ID, type DynamicConfigInsertModel } from "@app/db/schema/dynamicConfig"
import scUser from "@app/db/schema/user"
import scUserOptions from "@app/db/schema/userOptions"
import { convertHexStringToBytes } from "@app/lib/base/utils/addresses"
import { db } from "@app/lib/server/connectors/db"
import { and, asc, count, eq, inArray, isNull, lt, sql } from "drizzle-orm"

/**
 * Retrieves the dynamic application config from the database (single row table).
 * @returns The application config object or null if not found.
 */
export async function dbGetDynamicConfig() {
    const [config] = await db.select().from(scDynamicConfig).where(eq(scDynamicConfig.id, DYNAMIC_CONFIG_ID)).limit(1)
    return config
}

/**
 * Updates the dynamic application config in the database.
 * @param config The updated config object.
 */
export async function dbUpdateDynamicConfig(config: Partial<DynamicConfigInsertModel>) {
    await db.update(scDynamicConfig).set(config).where(eq(scDynamicConfig.id, DYNAMIC_CONFIG_ID)).execute()
}

/**
 * Retrieves all address lists that are enabled from the database.
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
 * Retrieves all addresses from a specific address list.
 * @param addressListId The ID of the address list to retrieve addresses from.
 * @param includeDisabled Whether to include disabled addresses in the results (optional, defaults to false).
 * @returns An array of addresses from the specified address list.
 */
export async function dbGetAddressesByAddressListId(addressListId: string, includeDisabled = false) {
    const rows = await db
        .select({ address: scAddress })
        .from(scAddress)
        .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
        .where(
            includeDisabled
                ? eq(scPvtAddressListMember.addressListId, addressListId)
                : and(eq(scPvtAddressListMember.addressListId, addressListId), eq(scAddress.isDisabled, false)),
        )

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
 * Updates the closest match score and timestamp for each address in a report,
 * only when the incoming score beats the currently stored one.
 * @param addressListId The ID of the address list the addresses belong to.
 * @param closestMatches A map of address value to score (number of bytes matched).
 */
export async function dbUpdateClosestMatches(addressListId: string, closestMatches: Record<string, number>) {
    const entries = Object.entries(closestMatches)
    if (entries.length === 0) return

    await Promise.all(
        entries.map(([addressValue, score]) =>
            db
                .update(scAddress)
                .set({
                    closestMatch: score,
                    closestMatchRegisteredAt: new Date(),
                })
                .where(
                    and(
                        eq(scAddress.value, addressValue),
                        inArray(
                            scAddress.id,
                            db
                                .select({ id: scPvtAddressListMember.addressId })
                                .from(scPvtAddressListMember)
                                .where(eq(scPvtAddressListMember.addressListId, addressListId)),
                        ),
                        lt(scAddress.closestMatch, score),
                    ),
                )
                .execute(),
        ),
    )
}

/**
 * Retrieves the address list along with the user who created it.
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
 * Update any value inside an address list.
 * @param addressListId The ID of the address list to update.
 * @param updates An object containing the fields to update and their new values.
 */
export async function dbUpdateAddressList(addressListId: string, updates: Partial<AddressListInsertModel>) {
    await db.update(scAddressList).set(updates).where(eq(scAddressList.id, addressListId)).execute()
}

/**
 * Calculates and updates the average hash rate for a specific address list.
 *
 * Note: all calculations are done via SQL to avoid loading extra rows per report.
 * The interval is read from the config via a scalar subquery so no extra round-trip is needed.
 * @param lastReportAttempts The number of attempts from the last report.
 * @param addressListId The ID of the address list to update.
 */
export async function dbCalculateAverageAddressListHashRate(lastReportAttempts: string | number, addressListId: string) {
    const intervalSubquery = db
        .select({ val: scDynamicConfig.workerReportIntervalMs })
        .from(scDynamicConfig)
        .where(eq(scDynamicConfig.id, DYNAMIC_CONFIG_ID))
        .limit(1)

    await db
        .update(scAddressList)
        .set({
            averageHashRate: sql`
                ROUND(
                    CASE WHEN ${scAddressList.averageHashRate} = 0
                        THEN ${String(lastReportAttempts)}::numeric / ((${intervalSubquery}) / 1000.0)
                        ELSE (${String(lastReportAttempts)}::numeric / ((${intervalSubquery}) / 1000.0) + ${scAddressList.averageHashRate}) / 2
                    END
                )::integer
            `,
        })
        .where(eq(scAddressList.id, addressListId))
        .execute()
}

/**
 * Save a worker match to the database.
 * @param addressListId The ID of the address list to save the match for.
 * @param addressValue The value of the address to save.
 * @param encryptedPrivateKey The encrypted private key to save.
 * @returns The ID of the saved match, or null if not found.
 */
export async function dbSaveWorkerMatchToDb(addressListId: string, addressValue: string, encryptedPrivateKey: string) {
    const [row] = await db
        .select({ id: scAddress.id })
        .from(scAddress)
        .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
        .where(and(eq(scPvtAddressListMember.addressListId, addressListId), eq(scAddress.value, addressValue)))
        .limit(1)

    if (!row) return // address not found, local file is the fallback

    await db
        .update(scAddress)
        .set({
            encryptedPrivateKey,
            // Also update the closest match to the max score
            closestMatch: convertHexStringToBytes(addressValue).length,
        })
        .where(eq(scAddress.id, row.id))
        .execute()
}

/**
 * Disables an address list in the database.
 * @param addressListId The ID of the address list to disable.
 */
export async function dbDisableAddressList(addressListId: string) {
    await db.update(scAddressList).set({ isEnabled: false }).where(eq(scAddressList.id, addressListId)).execute()
}

/**
 * Disables an address list if all its addresses now have a private key (i.e., are fully matched).
 * @param addressListId The ID of the address list to check and potentially disable.
 */
export async function dbAutoDisableAddressListIfAllMatched(addressListId: string) {
    const [row] = await db
        .select({ count: count() })
        .from(scAddress)
        .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
        .where(and(eq(scPvtAddressListMember.addressListId, addressListId), isNull(scAddress.encryptedPrivateKey)))

    // (Row count of 0 = all addresses inside the address list have a registered private key)
    if (row && row.count === 0) await dbDisableAddressList(addressListId)
}

/**
 * Retrieves user options for a set of user IDs, returned as a map keyed by userId.
 * Users with no options row are omitted from the map.
 * @param userIds The user IDs to look up.
 * @returns A map of userId -> user options row.
 */
export async function dbGetUserOptionsByUserIds(userIds: string[]) {
    if (userIds.length === 0) return new Map<string, typeof scUserOptions.$inferSelect>()
    const rows = await db.select().from(scUserOptions).where(inArray(scUserOptions.userId, userIds))
    return new Map(rows.map(row => [row.userId, row]))
}
