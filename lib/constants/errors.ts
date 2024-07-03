export type AdditionalData = { [key: string]: any } | string | string[] | number | number[] | null

/**
 * The type definition for an error code.
 */
export type ErrorCode = {
    status: number
    code: string
    message: string
    data: any
}

/**
 * Formats an error and stringifies it for it to be supported by the `Error` class.
 * @param error The error code object to format.
 * @param message Replaces the standard error message with a custom one (optional).
 * @param additionalData Additional data to include in the error (optional).
 * @returns The formatted error string.
 */
export function formatError(error: ErrorCode, message?: string, additionalData?: AdditionalData): string {
    if (message) error.message = message

    let err: ErrorCode
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
 * Contains all the available error codes for the application.
 */
const errorCodes = {
    //=======
    //  400
    //=======
    MISSING_PARAMETER: {
        status: 400,
        code: "MISSING_PARAMETER",
        message: "A parameter is missing in the request.",
        data: null,
    },
    INVALID_NUMBER_PARAMETER: {
        status: 400,
        code: "INVALID_NUMBER_PARAMETER",
        message: "A number parameter is invalid.",
        data: null,
    },
    INVALID_CHAIN_ID_FOR_ADDRESS_TYPE: {
        status: 400,
        code: "INVALID_CHAIN_ID_FOR_ADDRESS_TYPE",
        message: "The chain ID does not match the address type.",
        data: null,
    },
    INVALID_ADDRESS_TYPE: {
        status: 400,
        code: "INVALID_ADDRESS_TYPE",
        message: "The address type is invalid.",
        data: null,
    },
    INVALID_BECH32_CHARACTER: {
        status: 400,
        code: "INVALID_BECH32_CHARACTER",
        message: "The Bech32 string contains an invalid character.",
        data: null,
    },
    INVALID_BECH32_CASE: {
        status: 400,
        code: "INVALID_BECH32_CASE",
        message: "The Bech32 string contains both upper and lower case characters.",
        data: null,
    },
    INVALID_BECH32_LENGTH: {
        status: 400,
        code: "INVALID_BECH32_LENGTH",
        message: "The Bech32 string has an invalid length.",
        data: null,
    },
    INVALID_BECH32_CHECKSUM: {
        status: 400,
        code: "INVALID_BECH32_CHECKSUM",
        message: "The Bech32 string has an invalid checksum.",
        data: null,
    },

    //=======
    //  401
    //=======
    UNAUTHORIZED: {
        status: 401,
        code: "UNAUTHORIZED",
        message: "You are not authorized to access this resource.",
        data: null,
    },
    LOCKED: {
        status: 401,
        code: "LOCKED",
        message: "Your account is locked. Please contact the administrator.",
        data: null,
    },
    YOU_CANNOT_LOCK_YOURSELF: {
        status: 401,
        code: "YOU_CANNOT_LOCK_YOURSELF",
        message: "You cannot lock yourself, why would you do that anyway?",
        data: null,
    },
    YOU_CANNOT_UNLOCK_YOURSELF: {
        status: 401,
        code: "YOU_CANNOT_UNLOCK_YOURSELF",
        message: "You cannot unlock yourself, would be too easy, right?",
        data: null,
    },

    //=======
    //  403
    //=======
    FORBIDDEN: {
        status: 403,
        code: "FORBIDDEN",
        message: "You are not allowed to access this resource.",
        data: null,
    },

    //=======
    //  404
    //=======
    NOT_FOUND: {
        status: 404,
        code: "NOT_FOUND",
        message: "The requested resource was not found.",
        data: null,
    },
    CHAIN_NOT_FOUND: {
        status: 404,
        code: "CHAIN_NOT_FOUND",
        message: "The requested chain was not found.",
        data: null,
    },
    ADDRESS_NOT_FOUND: {
        status: 404,
        code: "ADDRESS_NOT_FOUND",
        message: "The requested address was not found.",
        data: null,
    },
    ROLE_NOT_FOUND: {
        status: 404,
        code: "ROLE_NOT_FOUND",
        message: "The requested role was not found.",
        data: null,
    },
    USER_NOT_FOUND: {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "The requested user was not found.",
        data: null,
    },
    BECH32_SEPARATOR_NOT_FOUND: {
        status: 404,
        code: "INVALID_BECH32_SEPARATOR",
        message: "The Bech32 string does not contain a separator.",
        data: null,
    },

    //=======
    //  405
    //=======
    METHOD_NOT_ALLOWED: {
        status: 405,
        code: "METHOD_NOT_ALLOWED",
        message: "The request method is not allowed.",
        data: null,
    },

    //=======
    //  409
    //=======
    ADDRESS_DATA_FETCHED_TOO_SOON: {
        status: 409,
        code: "ADDRESS_DATA_FETCHED_TOO_SOON",
        message: "Address data must be fetched at least 10 seconds apart.",
        data: null,
    },

    //=======
    //  500
    //=======
    INTERNAL_SERVER_ERROR: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error has occurred.",
        data: null,
    },

    //=======
    //  501
    //=======
    NOT_IMPLEMENTED: {
        status: 501,
        code: "NOT_IMPLEMENTED",
        message: "This feature is not implemented yet.",
        data: null,
    },

    //=======
    //  999
    //=======
}

export default errorCodes
