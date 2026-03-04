import scAddress, { ADDRESS_NETWORK, ADDRESS_TYPE } from "@app/db/schema/address"
import { isValidCryptoAddress } from "@app/lib/base/utils/address"
import { db } from "@app/lib/server/connectors/db"
import { protectedProcedure, router } from "@app/lib/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
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
            if (!input.bypassChecksum && !isValidCryptoAddress(input.type, input.value)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid address (check format and checksum)" })
            }

            const [address] = await db
                .insert(scAddress)
                .values({
                    name: input.name,
                    network: input.network,
                    type: input.type,
                    value: input.value,
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
