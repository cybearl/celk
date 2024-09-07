import AutoSwagger from "adonis-autoswagger"
import dedent from "dedent-js"
import { rootPath } from "#lib/utils/paths"

import { createRequire } from "node:module"
import path from "node:path"

// Load the package.json file without showing Node.js warnings
const pck = createRequire(import.meta.url)(path.join(rootPath, "package.json"))

/**
 *  The description for the API (supports markdown).
 */
const description = dedent`
    **Celk** is a brute-forcing tool to work with Bitcoin and Ethereum addresses entirely
    written in Typescript.

    The goal that I have, is to build a dual (Xeon | Epyc)-based home server, and to run this project
    on it for years (or decades lol) to see if I can brute-force some addresses, of course,
    it's almost impossible but who knows, maybe I'll be lucky.

    *An API provided by [Cybearl](https://www.cybearl.com/), all rights reserved.*
`

/**
 * The type of the configuration for `adonis-autoswagger`.
 */
type AutoSwaggerOptions = Parameters<typeof AutoSwagger.default.docs>[1]

/**
 * The default configuration for `adonis-autoswagger`.
 */
const autoSwaggerBaseConfig: AutoSwaggerOptions = {
    path: rootPath + "/",
    tagIndex: 1,
    info: {
        title: "Celk",
        version: `v${pck.version}`,
        description: description,
    },
    snakeCase: true,
    debug: false,
    ignore: ["/swagger", "/docs", "/admin/*"],
    preferredPutPatch: "PUT",
    common: {
        parameters: {
            AddressType: {
                type: "string",
                format: "byte",
            },
        }, // OpenAPI conform parameters that are commonly used
        headers: {}, // OpenAPI conform headers that are commonly used
    },
    securitySchemes: {},
    authMiddlewares: ["auth"],
    defaultSecurityScheme: "BearerAuth",
    persistAuthorization: true, // Persist authorization between reloads on the swagger page
}

/**
 * The configuration for the default version documentation.
 */
export const autoSwaggerDefaultVersionConfig: AutoSwaggerOptions = {
    ...autoSwaggerBaseConfig,
}
