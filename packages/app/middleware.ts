import { PRIVATE_ENV, PUBLIC_ENV } from "@app/config/env"
import { fullyPermissiveCspHeader } from "@cybearl/cypack"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Generate the Content Security Policy (CSP) header value.
 * @param nonce The nonce to use in the CSP.
 * @returns The CSP header value.
 */
function getCSPHeader(nonce: string) {
    // All subdomains allowed for CSP
    const domains = PUBLIC_ENV.appUrl.split(",")
    const wildcardDomains = domains.map(domain => `https://${domain.replace(/^https?:\/\//, "*.")}`).join(" ")

    // Cybearl's domains allowed for tracking and analytics
    const cybearlDomains = "https://*.cybearl.com https://cybearl.com"

    // Iconify domains allowed for CSP
    const iconifyDomains = `
        https://code.iconify.design
        https://api.iconify.design
        https://api.unisvg.com
        https://api.simplesvg.com
    `
        .replace(/\s{2,}/g, " ")
        .trim()

    const cspHeader = `
        default-src 'none';
        connect-src 'self' ${wildcardDomains} ${cybearlDomains} ${iconifyDomains};
        script-src 'strict-dynamic' 'nonce-${nonce}';
        style-src 'self' 'unsafe-inline' *.googleapis.com *.gstatic.com;
        font-src 'self' *.googleapis.com *.gstatic.com;
        img-src 'self' blob: data:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-src 'self' *.youtube.com;
        frame-ancestors 'self';
        manifest-src 'self';
        media-src 'self';
        worker-src 'self';
        upgrade-insecure-requests;
    `
        .replace(/\s{2,}/g, " ")
        .trim()

    // Use fully permissive CSP header in non-production environments
    const header = PRIVATE_ENV.nodeEnv !== "production" ? fullyPermissiveCspHeader : cspHeader

    return header
}

/**
 * The Next.js middleware.
 * @param request The incoming request.
 * @returns The response.
 */
export function middleware(request: NextRequest) {
    const nonce = globalThis.crypto.randomUUID()
    const cspHeader = getCSPHeader(nonce)

    // Request headers
    request.headers.set("Content-Security-Policy", cspHeader)
    request.headers.set("x-nonce", nonce)

    // Response headers based on status
    let response: NextResponse<unknown>
    if (PUBLIC_ENV.appStatus === "enabled") {
        response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    } else {
        switch (PUBLIC_ENV.appStatus) {
            case "in-development":
                request.nextUrl.pathname = "/coming-soon"
                break
            case "in-maintenance":
            case "disabled":
                request.nextUrl.pathname = "/unavailable"
                break
        }

        response = NextResponse.rewrite(new URL(request.nextUrl), {
            request: {
                headers: request.headers,
            },
        })
    }

    // Response headers
    response.headers.set("Content-Security-Policy", cspHeader)
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")

    return response
}

/**
 * The Next.js middleware configuration.
 */
export const config = {
    /**
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (assets folder containing all static files)
     */
    matcher: [
        {
            source: "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
            missing: [
                { type: "header", key: "next-router-prefetch" },
                { type: "header", key: "purpose", value: "prefetch" },
            ],
        },
    ],
}
