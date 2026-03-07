import scAddress from "@app/db/schema/address"
import scAddressList from "@app/db/schema/addressList"
import scPvtAddressListMember from "@app/db/schema/addressListMember"
import scConfig, { CONFIG_ID } from "@app/db/schema/config"
import { db } from "@app/lib/server/connectors/db"
import { protectedProcedure, router } from "@app/lib/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import { and, count, eq, inArray } from "drizzle-orm"
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
            const [[{ listCount }], [config]] = await Promise.all([
                db
                    .select({ listCount: count() })
                    .from(scAddressList)
                    .where(eq(scAddressList.userId, ctx.session.user.id)),
                db
                    .select({
                        maxAddressListsPerUser: scConfig.maxAddressListsPerUser,
                        maxAddressesPerList: scConfig.maxAddressesPerList,
                    })
                    .from(scConfig)
                    .where(eq(scConfig.id, CONFIG_ID))
                    .limit(1),
            ])

            if (!config) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Config not found: run the seeder." })
            }

            if (listCount >= config.maxAddressListsPerUser) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You have reached the maximum number of address lists allowed.",
                })
            }

            if (input.addressIds.length > config.maxAddressesPerList) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You have exceeded the maximum number of addresses per list.",
                })
            }

            if (input.addressIds.length > 0) {
                const ownedAddresses = await db
                    .select({ id: scAddress.id })
                    .from(scAddress)
                    .where(and(inArray(scAddress.id, input.addressIds), eq(scAddress.userId, ctx.session.user.id)))

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
            const [[addressList], [{ memberCount }], [config]] = await Promise.all([
                db
                    .select({ id: scAddressList.id })
                    .from(scAddressList)
                    .where(and(eq(scAddressList.id, input.id), eq(scAddressList.userId, ctx.session.user.id)))
                    .limit(1),
                db
                    .select({ memberCount: count() })
                    .from(scPvtAddressListMember)
                    .where(eq(scPvtAddressListMember.addressListId, input.id)),
                db
                    .select({ maxAddressesPerList: scConfig.maxAddressesPerList })
                    .from(scConfig)
                    .where(eq(scConfig.id, CONFIG_ID))
                    .limit(1),
            ])

            if (!addressList) throw new TRPCError({ code: "NOT_FOUND" })

            if (!config) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Config not found: run the seeder." })
            }

            if (memberCount >= config.maxAddressesPerList) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This list has reached the maximum number of addresses allowed.",
                })
            }

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
