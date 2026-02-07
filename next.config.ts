import { createRequire } from "node:module"
import path from "node:path"
import type { NextConfig } from "next"

// Load the package.json file without showing Node.js warnings
const pck = createRequire(import.meta.url)(path.join(process.cwd(), "package.json"))
const version = pck.version as string

/**
 * Main Next.js configuration.
 */
const nextConfig: NextConfig = {
    distDir: "build",
    reactStrictMode: true,
    transpilePackages: [],
    env: {
        VERSION: version,
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "**" },
            { protocol: "http", hostname: "localhost" },
            { protocol: "https", hostname: "localhost" },
        ],
    },
    turbopack: {
        resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    },
    webpack: config => {
        config.resolve.extensionAlias = {
            ".js": [".ts", ".tsx", ".js", ".jsx"],
            ".mjs": [".mts", ".mjs"],
            ".cjs": [".cts", ".cjs"],
        }

        return config
    },
    // biome-ignore lint/suspicious/useAwait: Redirects needs it
    async redirects() {
        return [
            // Basic redirect
            // {
            //     source: "/a",
            //     destination: "/b",
            //     permanent: true,
            // },
        ]
    },
}

export default nextConfig
