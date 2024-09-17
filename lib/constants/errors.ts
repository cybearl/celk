/**
 * The type definition for additional data that can be attached to an error object.
 */
export type ErrorObjAdditionalData = { [key: string]: any } | string | string[] | number | number[] | null

/**
 * The type definition for an error object.
 */
export type ErrorObj = {
    status: number
    name: string
    message: string
    data: any
}

/**
 * Formats an `ErrorObj` and stringifies it for it to be supported by the `Error` class.
 * @param error The `ErrorObj` object to format.
 * @param message Replaces the standard error message with a custom one (optional).
 * @param additionalData Additional data to include in the error (optional).
 * @returns The formatted error string.
 */
export function fe(error: ErrorObj, message?: string, additionalData?: ErrorObjAdditionalData): string {
    if (message) error.message = message

    let err: ErrorObj
    if (additionalData) err = { ...error, data: additionalData }
    else err = error

    // Allow special keys in the JSON stringification
    const allowSpecialKeys = (_: string, value: unknown) => {
        if (typeof value === "function") return value.toString()
        if (typeof value === "bigint") return value.toString()

        return value
    }

    return JSON.stringify(err, allowSpecialKeys, 4)
}

/**
 * Contains all the available errors for the application.
 */
export const AppErrors = {
    //=======
    //  400
    //=======
    MISSING_PARAMETER: {
        status: 400,
        name: "MISSING_PARAMETER",
        message: "A parameter is missing in the request.",
        data: null,
    },
    INVALID_NUMBER_PARAMETER: {
        status: 400,
        name: "INVALID_NUMBER_PARAMETER",
        message: "A number parameter is invalid.",
        data: null,
    },
    INVALID_CHAIN_ID_FOR_ADDRESS_TYPE: {
        status: 400,
        name: "INVALID_CHAIN_ID_FOR_ADDRESS_TYPE",
        message: "The chain ID does not match the address type.",
        data: null,
    },
    INVALID_ADDRESS_TYPE: {
        status: 400,
        name: "INVALID_ADDRESS_TYPE",
        message: "The address type is invalid.",
        data: null,
    },
    INVALID_TOKEN_SCOPE: {
        status: 400,
        name: "INVALID_TOKEN_SCOPE",
        message: "The token scope is invalid.",
        data: null,
    },

    //=======
    //  401
    //=======
    UNAUTHENTICATED: {
        status: 401,
        name: "UNAUTHENTICATED",
        message: "You must be authenticated to access this resource.",
        data: null,
    },
    UNAUTHORIZED: {
        status: 401,
        name: "UNAUTHORIZED",
        message: "You are not authorized to access this resource.",
        data: null,
    },
    LOCKED: {
        status: 401,
        name: "LOCKED",
        message: "Your account is locked. Please contact an administrator.",
        data: null,
    },
    YOU_CANNOT_LOCK_YOURSELF: {
        status: 401,
        name: "YOU_CANNOT_LOCK_YOURSELF",
        message: "You cannot lock yourself, why would you do that anyway?",
        data: null,
    },
    YOU_CANNOT_UNLOCK_YOURSELF: {
        status: 401,
        name: "YOU_CANNOT_UNLOCK_YOURSELF",
        message: "You cannot unlock yourself, would be too easy, right?",
        data: null,
    },
    INVALID_TOKEN: {
        status: 401,
        name: "INVALID_TOKEN",
        message: "The token is either expired or invalid.",
        data: null,
    },

    //=======
    //  403
    //=======
    FORBIDDEN: {
        status: 403,
        name: "FORBIDDEN",
        message: "You are not allowed to access this resource.",
        data: null,
    },

    //=======
    //  404
    //=======
    NOT_FOUND: {
        status: 404,
        name: "NOT_FOUND",
        message: "The requested resource was not found.",
        data: null,
    },
    CHAIN_NOT_FOUND: {
        status: 404,
        name: "CHAIN_NOT_FOUND",
        message: "This chain does not exist or is not supported.",
        data: null,
    },
    ADDRESS_NOT_FOUND: {
        status: 404,
        name: "ADDRESS_NOT_FOUND",
        message: "The requested address was not found.",
        data: null,
    },
    JOB_NOT_FOUND: {
        status: 404,
        name: "JOB_NOT_FOUND",
        message: "The requested job was not found.",
        data: null,
    },
    ROLE_NOT_FOUND: {
        status: 404,
        name: "ROLE_NOT_FOUND",
        message: "The requested role was not found.",
        data: null,
    },
    TOKEN_NOT_FOUND: {
        status: 404,
        name: "TOKEN_NOT_FOUND",
        message: "The requested token was not found.",
        data: null,
    },
    USER_NOT_FOUND: {
        status: 404,
        name: "USER_NOT_FOUND",
        message: "The requested user was not found.",
        data: null,
    },

    //=======
    //  405
    //=======
    METHOD_NOT_ALLOWED: {
        status: 405,
        name: "METHOD_NOT_ALLOWED",
        message: "The request method is not allowed.",
        data: null,
    },

    //=======
    //  409
    //=======
    ADDRESS_DATA_FETCHED_TOO_SOON: {
        status: 409,
        name: "ADDRESS_DATA_FETCHED_TOO_SOON",
        message: "Address data must be fetched at least 10 seconds apart.",
        data: null,
    },
    CHAIN_ALREADY_EXISTS: {
        status: 409,
        name: "CHAIN_ALREADY_EXISTS",
        message: "A chain with this ID or name already exists.",
        data: null,
    },
    ROLE_ALREADY_EXISTS: {
        status: 409,
        name: "ROLE_ALREADY_EXISTS",
        message: "A role with this name already exists.",
        data: null,
    },
    EMAIL_ALREADY_EXISTS: {
        status: 409,
        name: "EMAIL_ALREADY_EXISTS",
        message: "A user with this email already exists.",
        data: null,
    },
    USERNAME_ALREADY_EXISTS: {
        status: 409,
        name: "USERNAME_ALREADY_EXISTS",
        message: "A user with this username already exists.",
        data: null,
    },

    //=======
    //  500
    //=======
    INTERNAL_SERVER_ERROR: {
        status: 500,
        name: "INTERNAL_SERVER_ERROR",
        message: "An internal server error has occurred.",
        data: null,
    },

    //=======
    //  501
    //=======
    NOT_IMPLEMENTED: {
        status: 501,
        name: "NOT_IMPLEMENTED",
        message: "This feature is not implemented yet.",
        data: null,
    },

    //=======
    //  999
    //=======
}

/**
 * Contains all the available errors for the kernel.
 */
export const KernelErrors = {
    //=======
    //  400
    //=======
    INVALID_BECH32_CHARACTER: {
        status: 400,
        name: "INVALID_BECH32_CHARACTER",
        message: "The Bech32 string contains an invalid character.",
        data: null,
    },
    INVALID_BECH32_CASE: {
        status: 400,
        name: "INVALID_BECH32_CASE",
        message: "The Bech32 string contains both upper and lower case characters.",
        data: null,
    },
    INVALID_BECH32_LENGTH: {
        status: 400,
        name: "INVALID_BECH32_LENGTH",
        message: "The Bech32 string has an invalid length.",
        data: null,
    },
    INVALID_BECH32_CHECKSUM: {
        status: 400,
        name: "INVALID_BECH32_CHECKSUM",
        message:
            "The Bech32 string has an invalid checksum, either because of a typo, or because it is the wrong encoding.",
        data: null,
    },
    EMPTY_BECH32_HRP: {
        status: 400,
        name: "INVALID_BECH32_PREFIX",
        message: "The Bech32 string has no prefix.",
        data: null,
    },
    INVALID_BECH32_DATA: {
        status: 400,
        name: "INVALID_BECH32_DATA",
        message: "The Bech32 string contains invalid data.",
        data: null,
    },
    INVALID_CACHE_LENGTH: {
        status: 400,
        name: "INVALID_CACHE_LENGTH",
        message: "The cache length is invalid.",
        data: null,
    },
    INVALID_PRIVATE_KEY_LENGTH: {
        status: 400,
        name: "INVALID_PRIVATE_KEY_LENGTH",
        message: "The private key has an invalid length (must be 32 bytes).",
        data: null,
    },
    INVALID_BASE58_CHARACTER: {
        status: 400,
        name: "INVALID_BASE58_CHARACTER",
        message: "The Base58 string contains an invalid character.",
        data: null,
    },

    //=======
    //  404
    //=======
    BECH32_SEPARATOR_NOT_FOUND: {
        status: 404,
        name: "INVALID_BECH32_SEPARATOR",
        message: "The Bech32 string does not contain a separator.",
        data: null,
    },
}
