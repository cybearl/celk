import { authClient } from "@app/lib/client/connectors/auth-client"
import type { Session } from "@app/types/auth"
import type { ReactNode } from "react"
import { createContext, useContext } from "react"

/**
 * The type for the session context.
 */
export type SessionContextType = {
    session: Session | null
    isLoading: boolean
    error: Error | null
}

/**
 * The `Session` context, providing the current user's session information.
 */
export const SessionContext = createContext<SessionContextType | undefined>(undefined)

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
    const { data: session, isPending: isSessionLoading, error: sessionError } = authClient.useSession()

    // Prefer loading the client-side session if available
    const activeSession = session !== undefined ? (session as Session | null) : initialSession

    return (
        <SessionContext.Provider
            value={{
                session: activeSession,
                isLoading: isSessionLoading,
                error: sessionError,
            }}
        >
            {children}
        </SessionContext.Provider>
    )
}

/**
 * A custom hook to access the current user's session information from the `SessionContext`.
 * @returns The current user's session information.
 */
export function useSessionContext() {
    const ctx = useContext(SessionContext)
    if (ctx === undefined) throw new Error("'useSessionContext' must be used within a 'SessionProvider'")
    return ctx
}
