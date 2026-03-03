import auth from "@app/lib/auth"
import { convertNodeHeadersToWebHeaders } from "@app/lib/server/utils/headers"
import type { Session } from "@app/types/auth"
import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"

/**
 * The type of the `getServerSideProps` function with an injected session.
 */
type GetServerSidePropsWithSession<P extends Record<string, unknown>> = (
    ctx: GetServerSidePropsContext,
    session: Session | null,
) => Promise<GetServerSidePropsResult<P>>

/**
 * Wraps a `getServerSideProps` function and injects the authenticated session
 * as a second argument. Falls back to `null` if no session is found or loading fails.
 * @param gssp The `getServerSideProps` callback to wrap, receiving `(ctx, session)`.
 * @returns A standard `GetServerSideProps` function usable by any page.
 */
export function withSession<P extends Record<string, unknown>>(
    gssp: GetServerSidePropsWithSession<P>,
): GetServerSideProps<P> {
    return async ctx => {
        let session: Session | null = null

        try {
            const headers = convertNodeHeadersToWebHeaders(ctx.req.headers)
            const sessionData = await auth.api.getSession({ headers })
            if (sessionData) session = sessionData
        } catch (error) {
            console.debug("(withSession) Failed to load session on server-side:", error)
        }

        return gssp(ctx, session)
    }
}
