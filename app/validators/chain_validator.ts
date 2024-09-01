import { MAX_NAME_LENGTH, MAX_NATIVE_CURRENCY_LENGTH } from "#lib/constants/database"
import vine from "@vinejs/vine"

/**
 * Validator for a chain creation.
 */
export const chainCreationValidator = vine.compile(
    vine.object({
        id: vine.number().positive(),
        name: vine.string().minLength(1).maxLength(MAX_NAME_LENGTH),
        nativeCurrency: vine.string().minLength(1).maxLength(MAX_NATIVE_CURRENCY_LENGTH),
        explorerUrl: vine.string().url(),
    })
)

/**
 * Validator for a chain update.
 */
export const chainUpdateValidator = vine.compile(
    vine.object({
        id: vine.number().positive().optional(),
        name: vine.string().minLength(1).maxLength(MAX_NAME_LENGTH).optional(),
        nativeCurrency: vine.string().minLength(1).maxLength(MAX_NATIVE_CURRENCY_LENGTH).optional(),
        explorerUrl: vine.string().url().optional(),
    })
)
