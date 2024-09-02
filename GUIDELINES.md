# Guidelines

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
- See [Swagger Parameter Types](https://swagger.io/docs/specification/describing-parameters/) for more information on parameter types to use inside the Swagger documentation.