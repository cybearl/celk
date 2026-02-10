import { authClient } from "@app/lib/connectors/auth-client"
import type { Session } from "@app/types/auth"
import type { ReactNode } from "react"
import { createContext, useContext } from "react"

/**
 * The `Session` context, providing the current user's session information.
 */
export const SessionContext = createContext<Session | undefined>(undefined)

/**
 * The props for the `SessionProvider` component.
 */
type SessionProviderProps = {
    initialSession: Session | null
    children: ReactNode
}

/**
 * Provides the current user's session information to the component tree.
 */
export default function SessionProvider({ initialSession, children }: SessionProviderProps) {
    const { data: session } = authClient.useSession()

    const activeSession = session !== undefined ? (session as Session | null) : initialSession

    return <SessionContext.Provider value={activeSession ?? undefined}>{children}</SessionContext.Provider>
}

/**
 * A custom hook to access the current user's session information from the `SessionContext`.
 */
export function useSessionContext() {
    const ctx = useContext(SessionContext)
    if (ctx === undefined) throw new Error("'useSessionContext' must be used within a 'SessionProvider'")
    return ctx
}
