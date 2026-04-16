import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scDynamicConfig, { DYNAMIC_CONFIG_ID } from "@app/db/schema/dynamicConfig"
import { convertBytesToHexAddress, decodeBitcoinAddress, isValidCryptoAddress } from "@app/lib/base/utils/addresses"
import { hexToNumericString } from "@app/lib/base/utils/numerics"
import { db } from "@app/lib/server/connectors/db"
import { router, unlockedProcedure } from "@app/lib/server/trpc/trpc"
import { decryptPrivateKey } from "@app/lib/server/utils/encryption"
import {
    ADDRESS_NETWORK,
    ADDRESS_PRIVATE_KEY_GENERATOR,
    ADDRESS_PRIVATE_KEY_GENERATOR_SUPPORTS_RANGE,
    ADDRESS_TYPE,
} from "@cybearl/celk-protocol"
import { TRPCError } from "@trpc/server"
import { and, count, desc, eq, getTableColumns, sql } from "drizzle-orm"
import z from "zod"

/**
 * The router for managing addresses.
 */
export const addressesRouter = router({
    /**
     * Retrieves all addresses belonging to the current user.
     * @param ctx The request context.
     * @returns An array of addresses.
     */
    getAll: unlockedProcedure.query(async ({ ctx }) => {
        return await db
            .select()
            .from(scAddress)
            .where(eq(scAddress.userId, ctx.session.user.id))
            .orderBy(desc(scAddress.attempts), sql`${scAddress.balance} DESC NULLS LAST`)
    }),

    /**
     * Retrieves only the balances for each address belonging to the current user,
     * also fetches the last checked date for each balance for display purposes.
     * @param ctx The request context.
     * @returns An array of objects containing each address ID, its current balance
     * and the last checked date for each balance.
     */
    getBalances: unlockedProcedure.query(async ({ ctx }) => {
        return await db
            .select({
                id: scAddress.id,
                balance: scAddress.balance,
                balanceCheckedAt: scAddress.balanceCheckedAt,
            })
            .from(scAddress)
            .where(eq(scAddress.userId, ctx.session.user.id))
    }),

    /**
     * Retrieves live worker-updated stats for each address belonging to the current user.
     * @param ctx The request context.
     * @returns An array of objects containing each address ID, its current attempts count,
     * its closest match score, and its encrypted private key (null if not yet found).
     */
    getLiveStats: unlockedProcedure.query(async ({ ctx }) => {
        return await db
            .select({
                id: scAddress.id,
                attempts: scAddress.attempts,
                closestMatch: scAddress.closestMatch,
                encryptedPrivateKey: scAddress.encryptedPrivateKey,
            })
            .from(scAddress)
            .where(eq(scAddress.userId, ctx.session.user.id))
    }),

    /**
     * Retrieves all addresses belonging to a specific address list.
     * @param ctx The request context.
     * @param input The input object containing the list ID.
     * @returns An array of addresses.
     */
    getByListId: unlockedProcedure.input(z.object({ listId: z.string() })).query(async ({ ctx, input }) => {
        const [list] = await db
            .select({ id: scAddressList.id })
            .from(scAddressList)
            .where(and(eq(scAddressList.id, input.listId), eq(scAddressList.userId, ctx.session.user.id)))
            .limit(1)

        if (!list) throw new TRPCError({ code: "NOT_FOUND" })

        return await db
            .select(getTableColumns(scAddress)) // Filters out the inner join columns
            .from(scAddress)
            .innerJoin(scPvtAddressListMember, eq(scPvtAddressListMember.addressId, scAddress.id))
            .where(eq(scPvtAddressListMember.addressListId, input.listId))
            .orderBy(desc(scAddress.attempts))
    }),

    /**
     * Creates a new crypto address for the current user after validating its format and checksum,
     * also automatically computes the pre-encoding for Bitcoin addresses.
     * @param ctx The request context.
     * @param input The input object containing the address details.
     * @returns The created address.
     */
    create: unlockedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                network: z.enum(ADDRESS_NETWORK),
                type: z.enum(ADDRESS_TYPE),
                value: z.string().min(1),
                bypassChecksum: z.boolean().optional(),
                privateKeyGenerator: z
                    .enum(ADDRESS_PRIVATE_KEY_GENERATOR)
                    .default(ADDRESS_PRIVATE_KEY_GENERATOR.RandBytes),
                privateKeyRangeStart: z
                    .string()
                    .regex(/^[0-9a-fA-F]+$/)
                    .optional(),
                privateKeyRangeEnd: z
                    .string()
                    .regex(/^[0-9a-fA-F]+$/)
                    .optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Ensures that the user doesn't go above their address limit
            const [[{ addressCount }], [config]] = await Promise.all([
                db
                    .select({
                        addressCount: count(),
                    })
                    .from(scAddress)
                    .where(eq(scAddress.userId, ctx.session.user.id)),
                db
                    .select({
                        maxAddressesPerUser: scDynamicConfig.maxAddressesPerUser,
                    })
                    .from(scDynamicConfig)
                    .where(eq(scDynamicConfig.id, DYNAMIC_CONFIG_ID))
                    .limit(1),
            ])

            if (!config) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Config not found: run the seeder." })
            }

            if (addressCount >= config.maxAddressesPerUser) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You have reached the maximum number of addresses allowed.",
                })
            }

            if (!input.bypassChecksum && !isValidCryptoAddress(input.type, input.value)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid address (check format and checksum)." })
            }

            const hasRange = input.privateKeyRangeStart || input.privateKeyRangeEnd
            if (hasRange && !ADDRESS_PRIVATE_KEY_GENERATOR_SUPPORTS_RANGE[input.privateKeyGenerator]) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Selected generator does not support private key ranges.",
                })
            }

            // Automatically add pre-encoding to all Bitcoin addresses
            let addressPreEncoding: string | undefined
            if (input.network === ADDRESS_NETWORK.BITCOIN) {
                const bytes = decodeBitcoinAddress(input.value)
                if (bytes) addressPreEncoding = convertBytesToHexAddress(bytes) ?? undefined
            }

            const [address] = await db
                .insert(scAddress)
                .values({
                    name: input.name,
                    network: input.network,
                    type: input.type,
                    value: input.value,
                    preEncoding: addressPreEncoding,
                    closestMatch: 0,
                    attempts: "0",
                    privateKeyGenerator: input.privateKeyGenerator,
                    privateKeyRangeStart: input.privateKeyRangeStart
                        ? hexToNumericString(input.privateKeyRangeStart)
                        : undefined,
                    privateKeyRangeEnd: input.privateKeyRangeEnd
                        ? hexToNumericString(input.privateKeyRangeEnd)
                        : undefined,
                    isDisabled: false,
                    userId: ctx.session.user.id,
                })
                .returning()

            return address
        }),

    /**
     * Retrieves an address by its ID.
     * @param ctx The request context.
     * @param input The input object containing the address ID.
     * @returns The address.
     */
    getById: unlockedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const [address] = await db
            .select()
            .from(scAddress)
            .where(and(eq(scAddress.id, input.id), eq(scAddress.userId, ctx.session.user.id)))
            .limit(1)

        if (!address) throw new TRPCError({ code: "NOT_FOUND" })
        return address
    }),

    /**
     * Updates the `isDisabled` flag for an address.
     * @param id The ID of the address to update.
     * @param isDisabled The new value for the `isDisabled` flag.
     * @returns The updated address object.
     */
    updateIsDisabled: unlockedProcedure
        .input(z.object({ id: z.string(), isDisabled: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const [address] = await db
                .update(scAddress)
                .set({ isDisabled: input.isDisabled })
                .where(and(eq(scAddress.id, input.id), eq(scAddress.userId, ctx.session.user.id)))
                .returning()

            if (!address) throw new TRPCError({ code: "NOT_FOUND" })
            return address
        }),

    /**
     * Decrypts and returns the private key for an address owned by the current user.
     * @param ctx The request context.
     * @param input The input object containing the address ID.
     * @returns The plaintext private key.
     */
    decryptPrivateKey: unlockedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const [address] = await db
            .select({ encryptedPrivateKey: scAddress.encryptedPrivateKey })
            .from(scAddress)
            .where(and(eq(scAddress.id, input.id), eq(scAddress.userId, ctx.session.user.id)))
            .limit(1)

        if (!address) throw new TRPCError({ code: "NOT_FOUND" })

        if (!address.encryptedPrivateKey) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "No private key found for this address.",
            })
        }

        return {
            privateKey: decryptPrivateKey(address.encryptedPrivateKey),
        }
    }),

    /**
     * Deletes an address by its ID.
     * @param ctx The request context.
     * @param input The input object containing the address ID.
     */
    deleteById: unlockedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const result = await db
            .delete(scAddress)
            .where(and(eq(scAddress.id, input.id), eq(scAddress.userId, ctx.session.user.id)))

        if (result.rowCount === 0) throw new TRPCError({ code: "NOT_FOUND" })
        return { success: true }
    }),
})
