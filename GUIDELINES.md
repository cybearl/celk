# Guidelines

General
-------
- The implementation order inside of the controllers should always be:
    - `index`
    - `store`
    - `show`
    - `update`
    - `destroy`
    - `<custom_routes>`
- All index routes must use the `paginate` method to return the metadata for the pagination.
- **Throwing function should never be used outside of workers.. (obviously lol).**
- See [Adonis-AutoSwagger](https://github.com/ad-on-is/adonis-autoswagger) for the Swagger documentation.
- Commands that are **not** registered into `/commands` and must not start the app can be run with
`cross-env NO_LIFECYCLE=true` `NO_LIFECYCLE` stands for "No Lifecycle" and will prevent the app from starting.

Kernel: Classes
---------------
- All private readonly properties should be written in UPPERCASE with a leading underscore.
- All private methods should be written in camelCase with a leading underscore.
- All methods should have a strongly typed return type.
- All number arrays should be replaced by Uint8Array.
- `Cache` should only be used for the main memory table and never
  for internal operations, use `Uint8Array` instead.
- The `Cache` instance where data is read or written should **never**
  be returned by a method.
- `NO_LIFECYCLE` injected env variable is used to prevent some features of the stack from starting.
- See [Swagger Parameter Types](https://swagger.io/docs/specification/describing-parameters/) for more information
on parameter types to use inside the Swagger documentation.

Others
------
Errors are separated into two types and stored inside `lib/constants/errors.ts`:
- `AppErrors` for errors that are thrown by the application:
    ```typescript
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
    },
    ```
- `KernelErrors` for errors that are thrown by the kernel.
    ```typescript
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
    },
    ```