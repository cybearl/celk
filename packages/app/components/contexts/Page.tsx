import { useSessionContext } from "@app/components/contexts/Session"
import type { ReactNode } from "react"
import { createContext, useContext, useState } from "react"

/**
 * The pages for the application.
 */
export enum Page {
    Home = "home",
    Dashboard = "dashboard",
    Settings = "settings",
    Profile = "profile",
    SignUp = "sign-up",
    SignIn = "sign-in",
}

/**
 * The type for the page context.
 */
export type PageContextType = {
    currentPage: Page
    setCurrentPage: (page: Page) => void
}

/**
 * The `PageContext` provides information about the current page (= application tab).
 */
export const PageContext = createContext<PageContextType | undefined>(undefined)

/**
 * The props for the `PageProvider` component.
 */
type PageProviderProps = {
    children: ReactNode
}

/**
 * Provides information about the current page (= application tab).
 */
export default function PageProvider({ children }: PageProviderProps) {
    const { session } = useSessionContext()

    const [currentPage, setCurrentPage] = useState<Page>(session ? Page.Dashboard : Page.Home)

    return (
        <PageContext.Provider
            value={{
                currentPage,
                setCurrentPage,
            }}
        >
            {children}
        </PageContext.Provider>
    )
}

/**
 * A custom hook to access the current page information from the `PageContext`.
 * @returns The current page information.
 */
export function usePageContext() {
    const ctx = useContext(PageContext)
    if (ctx === undefined) throw new Error("'usePageContext' must be used within a 'PageProvider'")
    return ctx
}
