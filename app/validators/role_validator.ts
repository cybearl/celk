import { cyGeneral } from "@cybearl/cypack"
import vine from "@vinejs/vine"

/**
 * Validator for a role creation.
 */
export const roleCreationValidator = vine.compile(
    vine.object({
        name: vine
            .string()
            .minLength(1)
            .maxLength(cyGeneral.constants.MAX_NAME_LENGTH)
            .regex(cyGeneral.constants.NAME_PATTERN),
        description: vine.string().minLength(1).maxLength(cyGeneral.constants.MAX_DESCRIPTION_LENGTH),
    })
)

/**
 * Validator for a role update.
 */
export const roleUpdateValidator = vine.compile(
    vine.object({
        name: vine
            .string()
            .minLength(1)
            .maxLength(cyGeneral.constants.MAX_NAME_LENGTH)
            .regex(cyGeneral.constants.NAME_PATTERN)
            .optional(),
        description: vine.string().minLength(1).maxLength(cyGeneral.constants.MAX_DESCRIPTION_LENGTH).optional(),
    })
)
