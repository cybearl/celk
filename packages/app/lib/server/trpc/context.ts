import auth from "@app/lib/auth"
import { convertNodeHeadersToWebHeaders } from "@app/lib/server/utils/headers"
import type { CreateNextContextOptions } from "@trpc/server/adapters/next"

/**
 * The context for the tRPC API, which includes the user's session and the request/response objects.
 * @param req Incoming request object from Next.js, which contains information about the HTTP request.
 * @param res Outgoing response object from Next.js, which can be used to send a response back to the client.
 * @returns An object containing the user's session (if authenticated) and the request/response objects,
 * which will be available in all tRPC procedures.
 */
export async function createContext({ req, res }: CreateNextContextOptions) {
    let session = null

    try {
        const headers = convertNodeHeadersToWebHeaders(req.headers)
        session = await auth.api.getSession({ headers })
    } catch {
        // No need to do anything here, the session will just be null
    }

    return {
        session,
        req,
        res,
    }
}

export type Context = Awaited<ReturnType<typeof createContext>>
