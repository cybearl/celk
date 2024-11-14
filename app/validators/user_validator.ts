import { cyGeneral } from "@cybearl/cypack"
import vine from "@vinejs/vine"

/**
 * Validator for a user update.
 */
export const userUpdateValidator = vine.compile(
    vine.object({
        email: vine.string().email().optional(),
        username: vine
            .string()
            .minLength(cyGeneral.constants.MIN_USERNAME_LENGTH)
            .maxLength(cyGeneral.constants.MAX_USERNAME_LENGTH)
            .regex(cyGeneral.constants.NAME_PATTERN)
            .optional(),
        password: vine
            .string()
            .minLength(cyGeneral.constants.MIN_PASSWORD_LENGTH)
            .maxLength(cyGeneral.constants.MAX_PASSWORD_LENGTH)
            .optional(),
        description: vine.string().minLength(1).maxLength(cyGeneral.constants.MAX_DESCRIPTION_LENGTH).optional(),
    })
)
