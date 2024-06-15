/**
 * Error code interface.
 */
export type ErrorCode = {
    status: number
    code: string
    message: string
    data: any
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
    //  500
    //=======
    INTERNAL_SERVER_ERROR: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error has occurred.",
        data: null,
    },
    MISSING_FIELD_FOR_SEEDING: {
        status: 500,
        code: "MISSING_FIELD_FOR_SEEDING",
        message: "A field is missing for seeding the database.",
        data: null,
    },
    COULD_NOT_CONNECT_TO_BINANCE: {
        status: 500,
        code: "COULD_NOT_CONNECT_TO_BINANCE",
        message: "Could not connect to Binance.",
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
}

export default errorCodes
