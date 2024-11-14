import { cyGeneral } from "@cybearl/cypack"
import vine from "@vinejs/vine"

/**
 * Validator for a user registering himself.
 */
export const userRegistrationValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional().requiredIfMissing("username"),
        username: vine
            .string()
            .minLength(cyGeneral.constants.MIN_USERNAME_LENGTH)
            .maxLength(cyGeneral.constants.MAX_USERNAME_LENGTH)
            .regex(cyGeneral.constants.NAME_PATTERN)
            .optional()
            .requiredIfMissing("email"),
        password: vine
            .string()
            .minLength(cyGeneral.constants.MIN_PASSWORD_LENGTH)
            .maxLength(cyGeneral.constants.MAX_PASSWORD_LENGTH),
        description: vine.string().minLength(1).maxLength(cyGeneral.constants.MAX_DESCRIPTION_LENGTH).optional(),
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
            .minLength(cyGeneral.constants.MIN_USERNAME_LENGTH)
            .maxLength(cyGeneral.constants.MAX_USERNAME_LENGTH)
            .regex(cyGeneral.constants.NAME_PATTERN)
            .optional()
            .requiredIfMissing("email"),
        password: vine
            .string()
            .minLength(cyGeneral.constants.MIN_PASSWORD_LENGTH)
            .maxLength(cyGeneral.constants.MAX_PASSWORD_LENGTH),
    })
)
