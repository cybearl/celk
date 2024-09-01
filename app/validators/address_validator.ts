import vine from "@vinejs/vine"

/**
 * Validator for an address creation request.
 */
export const addressCreationValidator = vine.compile(
    vine.object({
        hash: vine.string(),
        isLocked: vine.boolean().optional(),
        chainId: vine.number(),
    })
)
