import scRoles from "@app/db/schema/role"
import scUserRoles from "@app/db/schema/userRoles"
import { SEEDED_USER_ROLE_SLUGS } from "@app/db/seeders/roles"
import { db } from "@app/lib/server/connectors/db"
import type { Context } from "@app/lib/server/trpc/context"
import { initTRPC, TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
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

/**
 * A protected procedure that requires the user to not be locked.
 */
export const unlockedProcedure = protectedProcedure.use(({ ctx, next }) => {
    if (ctx.session.user.isLocked) throw new TRPCError({ code: "FORBIDDEN", message: "Your account is locked." })
    return next({ ctx })
})

/**
 * A protected procedure that requires the user to have the admin role.
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const [adminUserRole] = await db
        .select({ id: scUserRoles.id })
        .from(scUserRoles)
        .innerJoin(scRoles, eq(scRoles.id, scUserRoles.roleId))
        .where(and(eq(scUserRoles.userId, ctx.session.user.id), eq(scRoles.slug, SEEDED_USER_ROLE_SLUGS.ADMIN)))
        .limit(1)

    if (!adminUserRole) throw new TRPCError({ code: "FORBIDDEN" })
    return next({ ctx })
})
