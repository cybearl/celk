import NonceProvider from "@app/components/contexts/Nonce"
import { SourceCodePro } from "@app/config/fonts"
import { cn } from "@app/lib/utils/styling"
import type { AppContext as NextAppContext, AppProps as NextAppProps } from "next/app"
import NextApp from "next/app"

// Styles
import "@app/styles/globals.css"
//import { checkEnvironmentVariables } from "@app/lib/utils/env"
import { useEffect } from "react"

/**
 * The returned values from the `getInitialProps` method of the App component.
 * This is used to pass the nonce to the app.
 */
export type AppGetInitialPropsReturnType = {
    nonce: string | undefined
}

type AppProps = NextAppProps & AppGetInitialPropsReturnType

export default function App({ Component, pageProps, nonce }: AppProps) {
    //useEffect(() => checkEnvironmentVariables(), [])

    return (
        <NonceProvider nonce={nonce}>
            <div className={cn(SourceCodePro.variable, "font-source-code-pro h-full w-full")}>
                <Component {...pageProps} />
            </div>
        </NonceProvider>
    )
}

App.getInitialProps = async (appContext: NextAppContext) => {
    const appProps = await NextApp.getInitialProps(appContext)
    const { req, res } = appContext.ctx

    const nonce = req?.headers?.["x-nonce"] as string | undefined

    // Auto-redirect to home page if the requested page is not found
    if (res?.statusCode === 404) {
        res.writeHead(302, { location: "/" })
        res.end()
    }

    return {
        ...appProps,
        nonce,
    } satisfies AppGetInitialPropsReturnType
}
