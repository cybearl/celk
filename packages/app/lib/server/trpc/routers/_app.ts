import { router } from "@app/lib/server/trpc/trpc"
import { addressesRouter } from "./addresses"
import { addressListsRouter } from "./addressLists"
import { configRouter } from "./config"
import { usersRouter } from "./users"

/**
 * The main router for the application, which combines all individual routers
 * into a single API endpoint.
 */
export const appRouter = router({
    addresses: addressesRouter,
    addressLists: addressListsRouter,
    config: configRouter,
    users: usersRouter,
})

/**
 * The type of the main application router, which is used to infer the types of
 * all API routes and procedures in the application.
 */
export type AppRouter = typeof appRouter
