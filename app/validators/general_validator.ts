import vine from "@vinejs/vine"

/**
 * Validator for the fetching of the CGAS status
 */
export const statusGettingValidator = vine.compile(
    vine.object({
        markerOnly: vine.boolean().optional(),
    })
)
