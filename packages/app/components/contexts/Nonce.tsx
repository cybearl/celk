import type { ReactNode } from "react"
import { createContext } from "react"

/**
 * The `Nonce` context, providing a secure nonce for inline styles and scripts.
 */
export const NonceContext = createContext<string | undefined>(undefined)

/**
 * The props for the `NonceProvider` component.
 */
type NonceProviderProps = {
    nonce: string | undefined
    children: ReactNode
}

/**
 * Provides a secure nonce for use in inline styles and scripts.
 */
export default function NonceProvider({ nonce, children }: NonceProviderProps) {
    return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
}
