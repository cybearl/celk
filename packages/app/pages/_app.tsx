import NonceProvider from "@app/components/contexts/Nonce"
import { SourceCodePro } from "@app/config/fonts"
import { cn } from "@app/lib/utils/styling"
import type { AppContext as NextAppContext, AppProps as NextAppProps } from "next/app"
import NextApp from "next/app"

// Styles
import "@app/styles/globals.css"
import SessionProvider from "@app/components/contexts/Session"
import auth from "@app/lib/auth"
import { checkEnvironmentVariables } from "@app/lib/utils/env"
import { convertNodeHeadersToWebHeaders } from "@app/lib/utils/headers"
import type { Session } from "@app/types/auth"
import { useEffect } from "react"

/**
 * The returned values from the `getInitialProps` method of the App component.
 * This is used to pass the nonce and server-side loaded session to the app.
 */
export type AppGetInitialPropsReturnType = {
    nonce: string | undefined
    session: Session | null
}

type AppProps = NextAppProps & AppGetInitialPropsReturnType

export default function App({ Component, pageProps, nonce, session }: AppProps) {
    useEffect(() => checkEnvironmentVariables(), [])

    return (
        <NonceProvider nonce={nonce}>
            <SessionProvider initialSession={session}>
                <div className={cn(SourceCodePro.variable, "font-source-code-pro h-full w-full")}>
                    <Component {...pageProps} />
                </div>
            </SessionProvider>
        </NonceProvider>
    )
}

App.getInitialProps = async (appContext: NextAppContext) => {
    const appProps = await NextApp.getInitialProps(appContext)
    const { req, res } = appContext.ctx

    let session: Session | null = null
    const nonce = req?.headers?.["x-nonce"] as string | undefined

    // Auto-redirect to home page if the requested page is not found
    if (res?.statusCode === 404) {
        res.writeHead(302, { location: "/" })
        res.end()

        return {
            ...appProps,
            nonce,
            session,
        }
    }

    if (req && res) {
        try {
            // Convert incoming headers into Web headers format
            const headers = convertNodeHeadersToWebHeaders(req.headers)

            // Attempt to load the session on the server-side using the auth API
            const sessionData = await auth.api.getSession({ headers })
            if (sessionData) session = sessionData
        } catch (error) {
            console.debug("Failed to load session on server-side:", error)
        }
    }

    return {
        ...appProps,
        nonce,
        session,
    } satisfies AppGetInitialPropsReturnType
}
