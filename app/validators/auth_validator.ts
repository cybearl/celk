import vine from "@vinejs/vine"
import {
    MAX_PASSWORD_LENGTH,
    MAX_USERNAME_LENGTH,
    MIN_PASSWORD_LENGTH,
    MIN_USERNAME_LENGTH,
    NAME_PATTERN,
} from "#lib/constants/database"

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
            .regex(NAME_PATTERN)
            .optional()
            .requiredIfMissing("email"),
        password: vine.string().minLength(MIN_PASSWORD_LENGTH).maxLength(MAX_PASSWORD_LENGTH),
    })
)
