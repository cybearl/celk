import scAddress, { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"
import scConfig, { CONFIG_ID } from "@app/db/schema/config"
import { convertBytesToHexAddress, decodeBitcoinAddress, isValidCryptoAddress } from "@app/lib/base/utils/addresses"
import { db } from "@app/lib/server/connectors/db"
import { protectedProcedure, router } from "@app/lib/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, count, eq } from "drizzle-orm"
import z from "zod"

/**
 * The router for managing addresses.
 */
export const addressesRouter = router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        return await db.select().from(scAddress).where(eq(scAddress.userId, ctx.session.user.id))
    }),

    create: protectedProcedure
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
            let preEncoding: string | undefined
            if (input.network === ADDRESS_NETWORK.BITCOIN) {
                const bytes = decodeBitcoinAddress(input.value)
                if (bytes) preEncoding = convertBytesToHexAddress(bytes) ?? undefined
            }

            const [address] = await db
                .insert(scAddress)
                .values({
                    name: input.name,
                    network: input.network,
                    type: input.type,
                    value: input.value,
                    preEncoding,
                    attempts: 0n,
                    isDisabled: false,
                    userId: ctx.session.user.id,
                })
                .returning()

            return address
        }),

    getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const [address] = await db
            .select()
            .from(scAddress)
            .where(and(eq(scAddress.id, input.id), eq(scAddress.userId, ctx.session.user.id)))
            .limit(1)

        if (!address) throw new TRPCError({ code: "NOT_FOUND" })

        return address
    }),

    deleteById: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const result = await db
            .delete(scAddress)
            .where(and(eq(scAddress.id, input.id), eq(scAddress.userId, ctx.session.user.id)))

        if (result.rowCount === 0) throw new TRPCError({ code: "NOT_FOUND" })
        return { success: true }
    }),
})
