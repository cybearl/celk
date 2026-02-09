import type { UserSelectModel } from "@app/db/schema/user"

/**
 * The type of the response sent back to the client after a successful sign-up.
 */
export type SignUpResponse = {
    token: string | null
    user: UserSelectModel
}
