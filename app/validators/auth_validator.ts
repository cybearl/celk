import vine from "@vinejs/vine"
import {
    MAX_PASSWORD_LENGTH,
    MAX_USERNAME_LENGTH,
    MIN_PASSWORD_LENGTH,
    MIN_USERNAME_LENGTH,
} from "#lib/constants/database"

/**
 * The regex pattern for the username.
 *
 * Only lowercase letters, numbers, underscores, and hyphens.
 */
export const usernamePattern = /^[a-z0-9_-]+$/

/**
 * Validator for the user credentials (either email or username).
 */
export const credentialsValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional().requiredIfMissing("username"),
        username: vine
            .string()
            .minLength(MIN_USERNAME_LENGTH)
            .maxLength(MAX_USERNAME_LENGTH)
            .regex(usernamePattern)
            .optional()
            .requiredIfMissing("email"),
        password: vine.string().minLength(MIN_PASSWORD_LENGTH).maxLength(MAX_PASSWORD_LENGTH),
    })
)
