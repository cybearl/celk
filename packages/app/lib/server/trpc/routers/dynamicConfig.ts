import scConfig, { DYNAMIC_CONFIG_ID } from "@app/db/schema/dynamicConfig"
import { db } from "@app/lib/server/connectors/db"
import { adminProcedure, publicProcedure, router } from "@app/lib/server/trpc/trpc"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import z from "zod"

/**
 * The router for managing the dynamic application config.
 */
export const dynamicConfigRouter = router({
    /**
     * Retrieves the dynamic application config row.
     * @returns The config object.
     */
    get: publicProcedure.query(async () => {
        const [config] = await db.select().from(scConfig).where(eq(scConfig.id, DYNAMIC_CONFIG_ID)).limit(1)

        if (!config) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "The dynamic application config row could not be found.",
            })
        }

        return config
    }),

    /**
     * Retrieves the dynamic application config global live stats.
     * @returns An object containing the current global live stats.
     */
    getLiveStats: publicProcedure.query(async () => {
        const [config] = await db
            .select({ attempts: scConfig.attempts })
            .from(scConfig)
            .where(eq(scConfig.id, DYNAMIC_CONFIG_ID))
            .limit(1)

        if (!config) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "The dynamic application config row could not be found.",
            })
        }

        return config
    }),

    /**
     * [ADMIN] Updates the application dynamic application config with the provided fields.
     * @param input The input object containing the config fields to update.
     * @returns The updated config object.
     */
    update: adminProcedure
        .input(
            z.object({
                lockNewUsers: z.boolean(),
                maxAddressesPerUser: z.number().int().positive(),
                maxAddressListsPerUser: z.number().int().positive(),
                maxAddressesPerList: z.number().int().positive(),
                maxRunningAddressListsPerUser: z.number().int().positive(),
                balanceCheckerDelayMs: z.number().int().positive(),
                maxBalanceCheckerRetries: z.number().int().positive(),
                balanceCheckerRetryBaseDelayMs: z.number().int().positive(),
                balanceCheckerRetryMaxDelayMs: z.number().int().positive(),
                workersManagerPollIntervalMs: z.number().int().positive(),
                maxWorkersManagerSyncRetries: z.number().int().positive(),
                workersManagerSyncRetryBaseDelayMs: z.number().int().positive(),
                workersManagerSyncRetryMaxDelayMs: z.number().int().positive(),
                workerReportIntervalMs: z.number().int().positive(),
            }),
        )
        .mutation(async ({ input }) => {
            const [config] = await db
                .update(scConfig)
                .set({ ...input, updatedAt: new Date() })
                .where(eq(scConfig.id, DYNAMIC_CONFIG_ID))
                .returning()

            if (!config) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "The dynamic application config row could not be found.",
                })
            }

            return config
        }),
})
