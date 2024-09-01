import { AppErrors } from "#lib/constants/errors"
import Chain from "#models/chain"
import { HttpContext } from "@adonisjs/core/http"
import BaseController from "#controllers/templates/base_controller"
import ChainPolicy from "#policies/chain_policy"
import { chainUpdateValidator } from "#validators/chain_validator"

export default class ChainsController extends BaseController {
    /**
     * Get all chains.
     */
    async index({ bouncer, request }: HttpContext) {
        if (await bouncer.with(ChainPolicy).denies("index")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        // Note: Chain are not isolated by user, so no need to filter by user ID
        const chains = await Chain.query()
            .orderBy(options.orderBy, options.orderDirection)
            .paginate(options.page, options.limit)

        const tmp = chains.toJSON()
        return this.successResponse(tmp.data, tmp.meta)
    }

    /**
     * Get all chains (reserved for administrators only).
     */
    async indexAll({ bouncer, request }: HttpContext) {
        if (await bouncer.with(ChainPolicy).denies("indexAll")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        const chains = await Chain.query()
            .orderBy(options.orderBy, options.orderDirection)
            .paginate(options.page, options.limit)

        const tmp = chains.toJSON()
        return this.successResponse(tmp.data, tmp.meta)
    }

    /**
     * Add a new chain.
     */
    async store({ bouncer, request }: HttpContext) {
        if (await bouncer.with(ChainPolicy).denies("store")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const { id, name, nativeCurrency, explorerUrl } = await request.validateUsing(chainUpdateValidator)

        if (await Chain.find(id)) return this.errorResponse(AppErrors.CHAIN_ALREADY_EXISTS)
        if (await Chain.findBy("name", name)) return this.errorResponse(AppErrors.CHAIN_ALREADY_EXISTS)

        const chain = await Chain.create({
            id,
            name,
            nativeCurrency,
            explorerUrl,
        })

        return this.successResponse(chain)
    }

    /**
     * Get chain by ID.
     */
    async show({ bouncer, params }: HttpContext) {
        const chain = await Chain.find(params.chain_id)
        if (!chain) return this.errorResponse(AppErrors.CHAIN_NOT_FOUND)

        if (await bouncer.with(ChainPolicy).denies("show")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        return this.successResponse(chain)
    }

    /**
     * Update chain by ID.
     */
    async update({ bouncer, request, params }: HttpContext) {
        const chain = await Chain.find(params.chain_id)
        if (!chain) return this.errorResponse(AppErrors.CHAIN_NOT_FOUND)

        if (await bouncer.with(ChainPolicy).denies("update")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const { id, name, nativeCurrency, explorerUrl } = await request.validateUsing(chainUpdateValidator)

        if (id && (await Chain.find(id))) return this.errorResponse(AppErrors.CHAIN_ALREADY_EXISTS)
        if (name && (await Chain.findBy("name", name))) return this.errorResponse(AppErrors.CHAIN_ALREADY_EXISTS)

        chain.id = id || chain.id
        chain.name = name || chain.name
        chain.nativeCurrency = nativeCurrency || chain.nativeCurrency
        chain.explorerUrl = explorerUrl || chain.explorerUrl
        await chain.save()

        return this.successResponse(chain)
    }

    /**
     * Delete chain by ID.
     */
    async destroy({ bouncer, params }: HttpContext) {
        const chain = await Chain.find(params.chain_id)
        if (!chain) return this.errorResponse(AppErrors.CHAIN_NOT_FOUND)

        if (await bouncer.with(ChainPolicy).denies("destroy")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        await chain.delete()
        return this.successResponse(chain)
    }
}
