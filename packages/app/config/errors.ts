import type { ErrorObj } from "@cybearl/cypack"
import { BaseErrors } from "@cybearl/cypack"

/**
 * Contains all the available errors for the application.
 */
export const APP_ERRORS = {
    ...BaseErrors,
    //=====//
    // 409 //
    //=====//
    USER_ALREADY_EXISTS: {
        status: 409,
        name: "USER_ALREADY_EXISTS",
        message: "User already exists.",
        data: null,
    },
    EMAIL_ALREADY_VERIFIED: {
        status: 409,
        name: "EMAIL_ALREADY_VERIFIED",
        message: "This email address has already been verified.",
        data: null,
    },
} as const satisfies Record<string, ErrorObj>
