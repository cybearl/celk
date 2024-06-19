import vine from "@vinejs/vine"
import { MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH, MIN_USERNAME_LENGTH } from "#lib/constants/db"

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
            .regex(/^[a-z0-9_-]+$/) // Only lowercase letters, numbers and underscores are allowed
            .optional()
            .requiredIfMissing("email"),
        password: vine.string().minLength(MIN_PASSWORD_LENGTH).maxLength(MAX_PASSWORD_LENGTH),
    })
)

/**
 * Validator for a user registration.
 */
export const userRegistrationValidator = vine.compile(
    vine.object({
        isLocked: vine.boolean().optional(),
        email: vine.string().email(),
        username: vine
            .string()
            .minLength(MIN_USERNAME_LENGTH)
            .maxLength(MAX_USERNAME_LENGTH)
            .regex(/^[a-z0-9_-]+$/), // Only lowercase letters, numbers and underscores are allowed
        password: vine.string().minLength(MIN_PASSWORD_LENGTH).maxLength(MAX_PASSWORD_LENGTH),
    })
)

/**
 * Validator for a user update.
 */
export const userUpdateValidator = vine.compile(
    vine.object({
        isLocked: vine.boolean().optional(),
        email: vine.string().email().optional(),
        username: vine
            .string()
            .minLength(MIN_USERNAME_LENGTH)
            .maxLength(MAX_USERNAME_LENGTH)
            .regex(/^[a-z0-9_-]+$/) // Only lowercase letters, numbers and underscores are allowed
            .optional(),
        password: vine.string().minLength(MIN_PASSWORD_LENGTH).maxLength(MAX_PASSWORD_LENGTH).optional(),
    })
)
