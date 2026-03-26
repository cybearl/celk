import { createContext } from "@app/lib/server/trpc/context"
import { appRouter } from "@app/lib/server/trpc/routers/_app"
import { createNextApiHandler } from "@trpc/server/adapters/next"

/**
 * Handle all tRPC API routes by creating a Next.js API handler
 * with the main application router and context.
 */
export default createNextApiHandler({ router: appRouter, createContext })

/**
 * Disallowing body parsing as it interferes with tRPC's own body parsing.
 */
export const config = {
    api: {
        bodyParser: false,
    },
}
