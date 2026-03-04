import type { Context } from "@app/lib/server/trpc/context"
import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"

/**
 * The main tRPC instance for the application, used to create routers and procedures.
 */
const t = initTRPC.context<Context>().create({ transformer: superjson })

/**
 * The main router for the application, used to define all API routes.
 */
export const router = t.router

/**
 * The main procedure for the application, used to define all API procedures.
 *
 * This is a base procedure that can be extended with middleware for
 * authentication, validation, etc.
 */
export const publicProcedure = t.procedure

/**
 * A protected procedure that requires the user to be authenticated.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" })
    return next({ ctx: { ...ctx, session: ctx.session } })
})
