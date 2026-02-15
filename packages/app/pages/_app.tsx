import NonceProvider from "@app/components/contexts/Nonce"
import PageProvider from "@app/components/contexts/Page"
import SessionProvider from "@app/components/contexts/Session"
import { SourceCodePro } from "@app/config/fonts"
import { checkEnvironmentVariables } from "@app/lib/base/utils/env"
import { cn } from "@app/lib/client/utils/styling"
import type { Session } from "@app/types/auth"
import type { AppContext as NextAppContext, AppProps as NextAppProps } from "next/app"
import NextApp from "next/app"
import { useEffect } from "react"

// Styles
import "@app/styles/globals.css"

/**
 * The returned values from the `getInitialProps` method of the App component.
 * This is used to pass the nonce and server-side loaded session to the app.
 */
export type AppGetInitialPropsReturnType = {
    nonce: string | undefined
    initialSession: Session | null
}

type AppProps = NextAppProps & AppGetInitialPropsReturnType

export default function App({ Component, pageProps, nonce, initialSession }: AppProps) {
    useEffect(() => checkEnvironmentVariables(), [])

    return (
        <NonceProvider nonce={nonce}>
            <SessionProvider initialSession={initialSession}>
                <PageProvider>
                    <div className={cn(SourceCodePro.variable, "font-source-code-pro h-full w-full")}>
                        <Component {...pageProps} />
                    </div>
                </PageProvider>
            </SessionProvider>
        </NonceProvider>
    )
}

App.getInitialProps = async (appContext: NextAppContext) => {
    const appProps = await NextApp.getInitialProps(appContext)
    const { req, res } = appContext.ctx

    let initialSession: Session | null = null
    const nonce = req?.headers?.["x-nonce"] as string | undefined

    // Auto-redirect to home page if the requested page is not found
    if (res?.statusCode === 404) {
        res.writeHead(302, { location: "/" })
        res.end()

        return {
            ...appProps,
            nonce,
            initialSession,
        }
    }

    if (typeof window === "undefined" && req && res) {
        try {
            // Import dynamically to avoid the client-side from importing these modules
            const { default: auth } = await import("@app/lib/auth")
            const { convertNodeHeadersToWebHeaders } = await import("@app/lib/server/utils/headers")

            // Convert incoming headers into Web headers format
            const headers = convertNodeHeadersToWebHeaders(req.headers)

            // Attempt to load the session on the server-side using the auth API
            const sessionData = await auth.api.getSession({ headers })
            if (sessionData) initialSession = sessionData
        } catch (error) {
            console.debug("Failed to load session on server-side:", error)
        }
    }

    return {
        ...appProps,
        nonce,
        initialSession,
    } satisfies AppGetInitialPropsReturnType
}
