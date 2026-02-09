import type { betterAuthOptions } from "@app/lib/auth"
import type { InferSession } from "better-auth"
import type { ReactNode } from "react"
import { createContext } from "react"

/**
 * The `Session` context, providing the current user's session information.
 */
export const SessionContext = createContext<InferSession<typeof betterAuthOptions> | undefined>(undefined)

/**
 * The props for the `SessionProvider` component.
 */
type SessionProviderProps = {
    initialSession: any
    children: ReactNode
}

/**
 * Provides the current user's session information to the component tree.
 */
export default function SessionProvider({ initialSession, children }: SessionProviderProps) {
    return <SessionContext.Provider value={undefined}>{children}</SessionContext.Provider>
}
