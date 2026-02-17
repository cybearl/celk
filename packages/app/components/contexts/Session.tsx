//import { authClient } from "@app/lib/client/connectors/auth-client"
import { authClient } from "@app/lib/client/connectors/auth-client"
import type { Session } from "@app/types/auth"
import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"

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
 *
 * Note: Does not use the session hook to prevent any flash on the client-side, it instead handles
 * the session state via the `getSession` function and the initially passed `initialSession` prop.
 */
export default function SessionProvider({ initialSession, children }: SessionProviderProps) {
    const [session, setSession] = useState<Session | null>(initialSession)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Fetch the session from the client
    useEffect(() => {
        setIsLoading(true)
        authClient
            .getSession()
            .then(({ data: clientSession, error }) => {
                setSession(clientSession ?? null)
                setError(error ? new Error(error.message) : null)
            })
            .finally(() => setIsLoading(false))
    }, [])

    return (
        <SessionContext.Provider
            value={{
                session,
                isLoading,
                error,
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
