import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "#lib/constants/database"
import vine from "@vinejs/vine"

/**
 * The regex pattern for the role name.
 *
 * Only lowercase letters, numbers, underscores.
 */
export const roleNamePattern = /^[a-z0-9_-]+$/

/**
 * Validator for a role creation.
 */
export const roleCreationValidator = vine.compile(
    vine.object({
        name: vine.string().minLength(1).maxLength(MAX_NAME_LENGTH).regex(roleNamePattern),
        description: vine.string().minLength(1).maxLength(MAX_DESCRIPTION_LENGTH),
    })
)

/**
 * Validator for a role update.
 */
export const roleUpdateValidator = vine.compile(
    vine.object({
        name: vine.string().minLength(1).maxLength(MAX_NAME_LENGTH).regex(roleNamePattern).optional(),
        description: vine.string().minLength(1).maxLength(MAX_DESCRIPTION_LENGTH).optional(),
    })
)
