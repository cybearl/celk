import { constants } from "@cybearl/cypack"
import vine from "@vinejs/vine"

/**
 * Validator for a user update.
 */
export const userUpdateValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional(),
        username: vine
            .string()
            .minLength(constants.MIN_USERNAME_LENGTH)
            .maxLength(constants.MAX_USERNAME_LENGTH)
            .regex(constants.NAME_PATTERN)
            .optional(),
        password: vine
            .string()
            .minLength(constants.MIN_PASSWORD_LENGTH)
            .maxLength(constants.MAX_PASSWORD_LENGTH)
            .optional(),
        description: vine.string().minLength(1).maxLength(constants.MAX_DESCRIPTION_LENGTH).optional(),
    })
)
