import auth from "@app/lib/auth"
import { toNodeHandler } from "better-auth/node"

/**
 * Handles all authentication-related API routes with Better Auth.
 */
export default toNodeHandler(auth.handler)

/**
 * Disallowing body parsing as it interferes with Better Auth's
 * own body parsing.
 */
export const config = { api: { bodyParser: false } }
