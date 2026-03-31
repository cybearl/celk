import scRoles from "@app/db/schema/role"
import scUser from "@app/db/schema/user"
import scUserOptions from "@app/db/schema/userOptions"
import scUserRoles from "@app/db/schema/userRoles"
import { normalizeUsername } from "@app/lib/base/utils/auth"
import { db } from "@app/lib/server/connectors/db"
import { adminProcedure, protectedProcedure, router, unlockedProcedure } from "@app/lib/server/trpc/trpc"
import { CyCONSTANTS } from "@cybearl/cypack"
import { TRPCError } from "@trpc/server"
import { and, eq, inArray, ne } from "drizzle-orm"
import z from "zod"

/**
 * The router for user management (self-service and admin).
 */
export const usersRouter = router({
    /**
     * Updates the current user's username and display name.
     * @param ctx The request context.
     * @param input The input object containing the new username and display name.
     * @returns The updated user object.
     */
    updateInfo: unlockedProcedure
        .input(
            z.object({
                username: z
                    .string()
                    .min(CyCONSTANTS.MIN_USERNAME_LENGTH)
                    .max(CyCONSTANTS.MAX_USERNAME_LENGTH)
                    .regex(CyCONSTANTS.USERNAME_REGEX),
                name: z.string().min(1),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const [existingUser] = await db
                .select({ id: scUser.id })
                .from(scUser)
                .where(and(eq(scUser.username, input.username), ne(scUser.id, ctx.session.user.id)))
                .limit(1)

            if (existingUser) throw new TRPCError({ code: "CONFLICT", message: "Username is already taken." })

            const [updated] = await db
                .update(scUser)
                .set({
                    username: input.username,
                    displayUsername: normalizeUsername(input.username),
                    name: input.name,
                })
                .where(eq(scUser.id, ctx.session.user.id))
                .returning()

            return updated
        }),

    /**
     * Retrieve the current user's options.
     * @param ctx The request context.
     * @returns The user options object, or null if not yet created.
     */
    getUserOptions: unlockedProcedure.query(async ({ ctx }) => {
        const [userOptions] = await db
            .select()
            .from(scUserOptions)
            .where(eq(scUserOptions.userId, ctx.session.user.id))
            .limit(1)

        return userOptions ?? null
    }),

    /**
     * Upsert the current user's options.
     * @param ctx The request context.
     * @param input The input object containing the options to update.
     * @returns The updated user options object.
     */
    updateUserOptions: unlockedProcedure
        .input(
            z.object({
                autoDisableZeroBalance: z.boolean(),
                mixGenerators: z.boolean(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const [userOptions] = await db
                .insert(scUserOptions)
                .values({
                    userId: ctx.session.user.id,
                    autoDisableZeroBalance: input.autoDisableZeroBalance,
                    mixGenerators: input.mixGenerators,
                })
                .onConflictDoUpdate({
                    target: scUserOptions.userId,
                    set: {
                        autoDisableZeroBalance: input.autoDisableZeroBalance,
                        mixGenerators: input.mixGenerators,
                    },
                })
                .returning()

            return userOptions
        }),

    /**
     * Delete the current user's account and all their role assignments in a single transaction.
     * @param ctx The request context.
     */
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
        await db.transaction(async tx => {
            await tx.delete(scUserRoles).where(eq(scUserRoles.userId, ctx.session.user.id))
            await tx.delete(scUser).where(eq(scUser.id, ctx.session.user.id))
        })

        return {
            success: true,
        }
    }),

    /**
     * [ADMIN] Replaces the target user's roles with the provided set of role slugs.
     * @param input The input object containing the target user ID and the new set of role slugs.
     */
    setRoles: adminProcedure
        .input(
            z.object({
                userId: z.string(),
                roleSlugs: z.array(z.string()),
            }),
        )
        .mutation(async ({ input }) => {
            const [user] = await db.select({ id: scUser.id }).from(scUser).where(eq(scUser.id, input.userId)).limit(1)
            if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." })

            const roles =
                input.roleSlugs.length > 0
                    ? await db.select({ id: scRoles.id }).from(scRoles).where(inArray(scRoles.slug, input.roleSlugs))
                    : []

            if (roles.length !== input.roleSlugs.length) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "One or more role slugs are invalid." })
            }

            await db.transaction(async tx => {
                await tx.delete(scUserRoles).where(eq(scUserRoles.userId, input.userId))

                if (roles.length > 0) {
                    await tx.insert(scUserRoles).values(
                        roles.map(role => ({
                            userId: input.userId,
                            roleId: role.id,
                        })),
                    )
                }
            })

            return {
                success: true,
            }
        }),

    /**
     * [ADMIN] Sets the locked state of the target user.
     * @param ctx The request context.
     * @param input The input object containing the user ID and the new locked state.
     */
    setLocked: adminProcedure
        .input(
            z.object({
                userId: z.string(),
                isLocked: z.boolean(),
            }),
        )
        .mutation(async ({ input }) => {
            const result = await db.update(scUser).set({ isLocked: input.isLocked }).where(eq(scUser.id, input.userId))
            if (result.rowCount === 0) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." })
            return { success: true }
        }),
})
