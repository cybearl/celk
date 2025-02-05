import BaseController from "#controllers/templates/base_controller"
import { rootPath } from "#lib/utils/paths"
import env from "#start/env"
import { HttpContext } from "@adonisjs/core/http"
import { getCGASStatus } from "@cybearl/cypack"
import { createRequire } from "node:module"
import path from "node:path"

// Load the package.json file without showing Node.js warnings
const pck = createRequire(import.meta.url)(path.join(rootPath, "package.json"))

export default class GeneralController extends BaseController {
    /**
     * Get the status of the service.
     */
    async status({ response }: HttpContext) {
        const status = getCGASStatus(
            env.get("APP_STATUS"),
            env.get("CGAS_MARKER"),
            pck.version,
            "A boilerplate provided by Cybearl!"
        )

        return response.status(200).json({
            success: true,
            data: status,
        })
    }
}
