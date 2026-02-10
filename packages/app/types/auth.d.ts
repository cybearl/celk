import type { SessionSelectModel } from "@app/db/schema/session"
import type { UserSelectModel } from "@app/db/schema/user"

/**
 * The type of the response sent back to the client after a successful sign-up.
 */
export type SignUpResponse = {
    token: string | null
    user: UserSelectModel
}

/**
 * The type for the main session returned by Better Auth (custom session plugin).
 */
export type Session = SessionSelectModel & {
    user: UserSelectModel
}
