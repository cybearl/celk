import { constants } from "@cybearl/cypack"
import vine from "@vinejs/vine"

/**
 * Validator for a user registering himself.
 */
export const userRegistrationValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional().requiredIfMissing("username"),
        username: vine
            .string()
            .minLength(constants.MIN_USERNAME_LENGTH)
            .maxLength(constants.MAX_USERNAME_LENGTH)
            .regex(constants.NAME_PATTERN)
            .optional()
            .requiredIfMissing("email"),
        password: vine.string().minLength(constants.MIN_PASSWORD_LENGTH).maxLength(constants.MAX_PASSWORD_LENGTH),
        description: vine.string().minLength(1).maxLength(constants.MAX_DESCRIPTION_LENGTH).optional(),
    })
)

/**
 * Validator for the user credentials (either email or username).
 */
export const credentialsValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional().requiredIfMissing("username"),
        username: vine
            .string()
            .minLength(constants.MIN_USERNAME_LENGTH)
            .maxLength(constants.MAX_USERNAME_LENGTH)
            .regex(constants.NAME_PATTERN)
            .optional()
            .requiredIfMissing("email"),
        password: vine.string().minLength(constants.MIN_PASSWORD_LENGTH).maxLength(constants.MAX_PASSWORD_LENGTH),
    })
)
