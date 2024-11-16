import { cyGeneral } from "@cybearl/cypack"

/**
 * Contains all the available errors for the application.
 */
export const AppErrors = {
    ...cyGeneral.errors.BaseErrors,
    //=====//
    // 400 //
    //=====//
    MISSING_PARAMETER: {
        status: 400,
        name: "MISSING_PARAMETER",
        message: "A parameter is missing.",
        data: null,
    },
    MISSING_AT_LEAST_ONE_PARAMETER: {
        status: 400,
        name: "MISSING_AT_LEAST_ONE_PARAMETER",
        message: "At least one parameter is required.",
        data: null,
    },
    INVALID_PARAMETER: {
        status: 400,
        name: "INVALID_PARAMETER",
        message: "Invalid parameter.",
        data: null,
    },
    EMPTY_DATA: {
        status: 400,
        name: "EMPTY_DATA",
        message: "Empty data is not allowed for this operation.",
        data: null,
    },
    INVALID_TOKEN_SCOPE: {
        status: 400,
        name: "INVALID_TOKEN_SCOPE",
        message: "Invalid token scope.",
        data: null,
    },
    INVALID_TOKEN: {
        status: 400,
        name: "INVALID_TOKEN",
        message: "Invalid token.",
        data: null,
    },
    INVALID_CREDENTIALS: {
        status: 400,
        name: "INVALID_CREDENTIALS",
        message: "Invalid credentials.",
        data: null,
    },
    //=====//
    // 401 //
    //=====//
    UNAUTHENTICATED: {
        status: 401,
        name: "UNAUTHENTICATED",
        message: "You are not authenticated. Please log in to access this resource.",
        data: null,
    },
    LOCKED: {
        status: 401,
        name: "LOCKED",
        message: "This account has been locked.",
        data: null,
    },
    YOU_CANNOT_LOCK_YOURSELF: {
        status: 401,
        name: "YOU_CANNOT_LOCK_YOURSELF",
        message: "You cannot lock yourself, why would you do that anyway??",
        data: null,
    },
    YOU_CANNOT_UNLOCK_YOURSELF: {
        status: 401,
        name: "YOU_CANNOT_UNLOCK_YOURSELF",
        message: "You cannot unlock yourself, would be too easy, right?",
        data: null,
    },
    //=====//
    // 404 //
    //=====//
    USER_NOT_FOUND: {
        status: 404,
        name: "USER_NOT_FOUND",
        message: "User not found.",
        data: null,
    },
    TOKEN_NOT_FOUND: {
        status: 404,
        name: "TOKEN_NOT_FOUND",
        message: "Token not found.",
        data: null,
    },
    ROLE_NOT_FOUND: {
        status: 404,
        name: "ROLE_NOT_FOUND",
        message: "Role not found.",
        data: null,
    },
    //=====//
    // 409 //
    //=====//
    EMAIL_ALREADY_EXISTS: {
        status: 409,
        name: "EMAIL_ALREADY_EXISTS",
        message: "This email is already in use by another user.",
        data: null,
    },
    USERNAME_ALREADY_EXISTS: {
        status: 409,
        name: "USERNAME_ALREADY_EXISTS",
        message: "This username is already in use by another user.",
        data: null,
    },
    ROLE_ALREADY_EXISTS: {
        status: 409,
        name: "ROLE_ALREADY_EXISTS",
        message: "This role already exists.",
        data: null,
    },
}

/**
 * Contains all the available errors for the kernel.
 */
export const KernelErrors = {
    //=====//
    // 400 //
    //=====//
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
    //=====//
    // 404 //
    //=====//
    BECH32_SEPARATOR_NOT_FOUND: {
        status: 404,
        name: "BECH32_SEPARATOR_NOT_FOUND",
        message: "The Bech32 string separator was not found.",
        data: null,
    },
    INSTRUCTION_SET_NOT_FOUND: {
        status: 404,
        name: "INSTRUCTION_SET_NOT_FOUND",
        message: "This instruction could not be found.",
        data: null,
    },
}
