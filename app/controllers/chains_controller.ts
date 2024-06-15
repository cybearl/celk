import errorCodes from "#lib/constants/errors"
import Controller from "#lib/templates/controller"
import Chain from "#models/chain"
import { HttpContext } from "@adonisjs/core/http"

export default class ChainsController extends Controller {
    /**
     * Get all chains.
     */
    async index() {
        const chains = await Chain.all()
        return this.successResponse({ chains })
    }

    /**
     * Add a new chain (only for administrators).
     */
    async store({}: HttpContext) {}

    /**
     * Get chain by ID.
     */
    async show({ params }: HttpContext) {
        const chain = await Chain.find(params.chain_id)
        if (!chain) {
            return this.errorResponse(
                errorCodes.CHAIN_NOT_FOUND,
                null,
                "This chain does not exist or is not supported."
            )
        }

        return this.successResponse({ chain })
    }

    /**
     * Update chain by ID (only for administrators).
     */
    async update({}: HttpContext) {}

    /**
     * Delete chain by ID (only for administrators).
     */
    async destroy({}: HttpContext) {}
}
