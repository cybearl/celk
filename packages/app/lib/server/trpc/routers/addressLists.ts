import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import { db } from "@app/lib/server/connectors/db"
import { protectedProcedure, router } from "@app/lib/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, eq, inArray } from "drizzle-orm"
import z from "zod"

/**
 * The router for managing address lists.
 */
export const addressListsRouter = router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        return await db.select().from(scAddressList).where(eq(scAddressList.userId, ctx.session.user.id))
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                addressIds: z.array(z.string()).min(1),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            if (input.addressIds.length > 0) {
                const ownedAddresses = await db
                    .select({ id: scAddress.id })
                    .from(scAddress)
                    .where(
                        and(
                            inArray(scAddress.id, input.addressIds),
                            eq(scAddress.userId, ctx.session.user.id),
                        ),
                    )

                if (ownedAddresses.length !== input.addressIds.length) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "One or more addresses do not belong to you.",
                    })
                }
            }

            const [addressList] = await db
                .insert(scAddressList)
                .values({
                    name: input.name,
                    isEnabled: false,
                    stopOnFirstMatch: false,
                    attempts: 0n,
                    userId: ctx.session.user.id,
                })
                .returning()

            if (input.addressIds.length > 0) {
                await db.insert(scPvtAddressListMember).values(
                    input.addressIds.map(addressId => ({
                        addressListId: addressList.id,
                        addressId,
                        attempts: 0n,
                    })),
                )
            }

            return addressList
        }),

    getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const [addressList] = await db
            .select()
            .from(scAddressList)
            .where(and(eq(scAddressList.id, input.id), eq(scAddressList.userId, ctx.session.user.id)))
            .limit(1)

        if (!addressList) throw new TRPCError({ code: "NOT_FOUND" })

        const members = await db
            .select({ addressId: scPvtAddressListMember.addressId })
            .from(scPvtAddressListMember)
            .where(eq(scPvtAddressListMember.addressListId, addressList.id))

        return { ...addressList, addressIds: members.map(m => m.addressId) }
    }),

    deleteById: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
        const result = await db
            .delete(scAddressList)
            .where(and(eq(scAddressList.id, input.id), eq(scAddressList.userId, ctx.session.user.id)))

        if (result.rowCount === 0) throw new TRPCError({ code: "NOT_FOUND" })
        return { success: true }
    }),

    addAddress: protectedProcedure
        .input(z.object({ id: z.string(), addressId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const [addressList] = await db
                .select({ id: scAddressList.id })
                .from(scAddressList)
                .where(and(eq(scAddressList.id, input.id), eq(scAddressList.userId, ctx.session.user.id)))
                .limit(1)

            if (!addressList) throw new TRPCError({ code: "NOT_FOUND" })

            const [address] = await db
                .select({ id: scAddress.id })
                .from(scAddress)
                .where(and(eq(scAddress.id, input.addressId), eq(scAddress.userId, ctx.session.user.id)))
                .limit(1)

            if (!address) throw new TRPCError({ code: "NOT_FOUND" })

            const [member] = await db
                .insert(scPvtAddressListMember)
                .values({
                    addressListId: input.id,
                    addressId: input.addressId,
                    attempts: 0n,
                })
                .returning()

            return member
        }),

    removeAddress: protectedProcedure
        .input(z.object({ id: z.string(), addressId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const [addressList] = await db
                .select({ id: scAddressList.id })
                .from(scAddressList)
                .where(and(eq(scAddressList.id, input.id), eq(scAddressList.userId, ctx.session.user.id)))
                .limit(1)

            if (!addressList) throw new TRPCError({ code: "NOT_FOUND" })

            const result = await db
                .delete(scPvtAddressListMember)
                .where(
                    and(
                        eq(scPvtAddressListMember.addressListId, input.id),
                        eq(scPvtAddressListMember.addressId, input.addressId),
                    ),
                )

            if (result.rowCount === 0) throw new TRPCError({ code: "NOT_FOUND" })
            return { success: true }
        }),
})
