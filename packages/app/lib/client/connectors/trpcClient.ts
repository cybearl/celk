import type { AppRouter } from "@app/lib/server/trpc/routers/_app"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import superjson from "superjson"

export const trpcClient = createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
})
