import type { IncomingHttpHeaders } from "node:http"

/**
 * Converts incoming HTTP headers from Node.js into Web headers format.
 * @param headers The incoming HTTP headers from Node.js.
 * @return The converted headers in Web format.
 */
export function convertNodeHeadersToWebHeaders(headers: IncomingHttpHeaders): Headers {
    const webHeaders = new Headers()

    for (const [key, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                webHeaders.append(key, v)
            }
        } else if (value !== undefined) {
            webHeaders.append(key, value)
        }
    }

    return webHeaders
}
