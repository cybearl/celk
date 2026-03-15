import scAddress, { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scConfig, { CONFIG_ID } from "@app/db/schema/config"
import { convertBytesToHexAddress, decodeBitcoinAddress, isValidCryptoAddress } from "@app/lib/base/utils/addresses"
import { db } from "@app/lib/server/connectors/db"
import { unlockedProcedure, router } from "@app/lib/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, count, eq, getTableColumns } from "drizzle-orm"
import z from "zod"

/**
 * The router for managing addresses.
 */
export const addressesRouter = router({
    /**
     * Retrieve all addresses belonging to the current user.
     * @param ctx The request context.
     * @returns An array of addresses.
     */
    getAll: unlockedProcedure.query(async ({ ctx }) => {
        return await db.select().from(scAddress).where(eq(scAddress.userId, ctx.session.user.id))
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
    }),

    /**
     * Create a new crypto address for the current user after validating its format and checksum,
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
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Ensures that the user doesn't go above their address limit
            const [[{ addressCount }], [config]] = await Promise.all([
                db.select({ addressCount: count() }).from(scAddress).where(eq(scAddress.userId, ctx.session.user.id)),
                db
                    .select({ maxAddressesPerUser: scConfig.maxAddressesPerUser })
                    .from(scConfig)
                    .where(eq(scConfig.id, CONFIG_ID))
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
                    attempts: 0n,
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
     * Deletes an address by its ID.
     * @param ctx The request context.
     * @param input The input object containing the address ID.
     */
    deleteById: unlockedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const result = await db
            .delete(scAddress)
            .where(and(eq(scAddress.id, input.id), eq(scAddress.userId, ctx.session.user.id)))

        if (result.rowCount === 0) throw new TRPCError({ code: "NOT_FOUND" })

        return {
            success: true,
        }
    }),
})
