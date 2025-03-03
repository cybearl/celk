import BaseController from "#controllers/templates/base_controller"
import { rootPath } from "#lib/utils/paths"
import env from "#start/env"
import { statusGettingValidator } from "#validators/general_validator"
import { HttpContext } from "@adonisjs/core/http"
import { generateCGASStatus } from "@cybearl/cypack/backend"
import { createRequire } from "node:module"
import path from "node:path"

// Load the package.json file without showing Node.js warnings
const pck = createRequire(import.meta.url)(path.join(rootPath, "package.json"))

export default class GeneralController extends BaseController {
    /**
     * Get the status of the service.
     */
    async status({ request, response }: HttpContext) {
        const { markerOnly } = await request.validateUsing(statusGettingValidator)

        const status = generateCGASStatus(
            env.get("APP_STATUS"),
            env.get("CGAS_MARKER"),
            pck.version,
            "A brute-forcing tool for Bitcoin and Ethereum addresses provided by Cybearl!",
            markerOnly
        )

        return response.status(200).json({
            success: true,
            data: status,
        })
    }
}
