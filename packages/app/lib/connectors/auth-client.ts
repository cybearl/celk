import type auth from "@app/auth"
import { PUBLIC_ENV } from "@app/config/env"
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

/**
 * The auth client for making requests to the Better Auth API.
 */
export const authClient = createAuthClient({
    baseURL: PUBLIC_ENV.appUrl,
    plugins: [inferAdditionalFields<typeof auth>(), usernameClient()],
})
