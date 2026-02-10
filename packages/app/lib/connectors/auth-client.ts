import { PUBLIC_ENV } from "@app/config/env"
import type { Auth } from "@app/lib/auth"
import { customSessionClient, usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

/**
 * The auth client for making requests to the Better Auth API.
 */
export const authClient = createAuthClient({
    baseURL: PUBLIC_ENV.appUrl,
    plugins: [customSessionClient<Auth>(), usernameClient()],
})
