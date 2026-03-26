import { addressesRouter } from "@app/lib/server/trpc/routers/addresses"
import { addressListsRouter } from "@app/lib/server/trpc/routers/addressLists"
import { dynamicConfigRouter } from "@app/lib/server/trpc/routers/dynamicConfig"
import { usersRouter } from "@app/lib/server/trpc/routers/users"
import { router } from "@app/lib/server/trpc/trpc"

/**
 * The main router for the application, which combines all individual routers
 * into a single API endpoint.
 */
export const appRouter = router({
    addresses: addressesRouter,
    addressLists: addressListsRouter,
    dynamicConfig: dynamicConfigRouter,
    users: usersRouter,
})

/**
 * The type of the main application router, which is used to infer the types of
 * all API routes and procedures in the application.
 */
export type AppRouter = typeof appRouter
