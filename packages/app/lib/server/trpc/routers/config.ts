import scConfig, { CONFIG_ID } from "@app/db/schema/config"
import { db } from "@app/lib/server/connectors/db"
import { adminProcedure, publicProcedure, router } from "@app/lib/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

/**
 * The router for managing the application config.
 * All procedures are restricted to admin users.
 */
export const configRouter = router({
    /**
     * Retrieves the application config row.
     * @returns The config object.
     */
    get: publicProcedure.query(async () => {
        const [config] = await db.select().from(scConfig).where(eq(scConfig.id, CONFIG_ID)).limit(1)
        if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "The config row could not be found." })
        return config
    }),

    /**
     * Retrieves only the global attempts counter from the config row.
     * @returns An object containing the current attempts count.
     */
    getAttempts: publicProcedure.query(async () => {
        const [config] = await db
            .select({ attempts: scConfig.attempts })
            .from(scConfig)
            .where(eq(scConfig.id, CONFIG_ID))
            .limit(1)

        if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "The config row could not be found." })
        return config
    }),

    /**
     * [ADMIN] Updates the application config with the provided fields.
     * @param input The input object containing the config fields to update.
     * @returns The updated config object.
     */
    update: adminProcedure
        .input(
            z.object({
                maxAddressesPerUser: z.number().int().positive(),
                maxAddressListsPerUser: z.number().int().positive(),
                maxAddressesPerList: z.number().int().positive(),
                balanceRefreshDelayMs: z.number().int().positive(),
            }),
        )
        .mutation(async ({ input }) => {
            const [config] = await db
                .update(scConfig)
                .set({ ...input, updatedAt: new Date() })
                .where(eq(scConfig.id, CONFIG_ID))
                .returning()

            if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "The config row could not be found." })
            return config
        }),
})
