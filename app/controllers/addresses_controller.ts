import BaseController from "#controllers/templates/base_controller"
import { AppErrors } from "#lib/constants/errors"
import { getAddressType } from "#lib/utils/addresses"
import Address from "#models/address"
import Chain from "#models/chain"
import AddressPolicy from "#policies/address_policy"
import { addressCreationValidator } from "#validators/address_validator"
import { fetchBitcoinAddressData, fetchEthereumAddressData } from "#workers/address_data_worker"
import { HttpContext } from "@adonisjs/core/http"
import logger from "@adonisjs/core/services/logger"
import { DateTime } from "luxon"

export default class AddressesController extends BaseController {
    /**
     * @index
     * @operationId getAddresses
     * @summary Get all addresses
     * @description Get all addresses with per-user data isolation and pagination.
     * @responseBody 200 - <Address[]>
     */
    async index({ auth, bouncer, request }: HttpContext) {
        if (await bouncer.with(AddressPolicy).denies("index")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        const addresses = await Address.query()
            .where("userId", auth.user!.id)
            .orderBy(options.orderBy, options.orderDirection)
            .paginate(options.page, options.limit)

        const res = addresses.toJSON()
        return this.successResponse(res.data, res.meta)
    }

    /**
     * Get all addresses (reserved for administrators only).
     */
    async indexAll({ bouncer, request }: HttpContext) {
        if (await bouncer.with(AddressPolicy).denies("indexAll")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        const addresses = await Address.query()
            .orderBy(options.orderBy, options.orderDirection)
            .paginate(options.page, options.limit)

        const res = addresses.toJSON()
        return this.successResponse(res.data, res.meta)
    }

    /**
     * Add a new address.
     */
    async store({ bouncer, request, auth }: HttpContext) {
        if (await bouncer.with(AddressPolicy).denies("store")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const { hash, isLocked, chainId } = await request.validateUsing(addressCreationValidator)

        const type = getAddressType(hash)
        if (!type) return this.errorResponse(AppErrors.INVALID_ADDRESS_TYPE)

        const chain = await Chain.find(chainId)
        if (!chain) return this.errorResponse(AppErrors.CHAIN_NOT_FOUND)

        const address = await Address.create({
            type,
            hash,
            isLocked,
            chainId,
            userId: auth.user!.id,
        })

        return this.successResponse(address)
    }

    /**
     * Get address by ID.
     */
    async show({ bouncer, params }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) return this.errorResponse(AppErrors.ADDRESS_NOT_FOUND)

        if (await bouncer.with(AddressPolicy).denies("show", address)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        return this.successResponse(address)
    }

    /**
     * Update address data by ID.
     */
    async update({ bouncer, params, auth }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) return this.errorResponse(AppErrors.ADDRESS_NOT_FOUND)

        if (await bouncer.with(AddressPolicy).denies("update", address)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        if (address.fetchedAt) {
            // Verify that the fetchedAt field is not < 10 seconds ago
            const diff = Math.abs(address.fetchedAt.diffNow("seconds").seconds)

            if (diff < 10) {
                logger.debug(`address data for ${address.hash} was fetched too soon (${diff} seconds < 10 seconds)`)
                return this.errorResponse(AppErrors.ADDRESS_DATA_FETCHED_TOO_SOON)
            }
        }

        await address.load("chain")

        switch (address.chain.name) {
            case "bitcoin":
                await fetchBitcoinAddressData(address)
                break
            case "ethereum":
                await fetchEthereumAddressData(address)
                break
        }

        address.isReady = true
        address.fetchedAt = DateTime.now()
        await address.save()

        logger.info(`user ${auth.user!.id} (${auth.user!.email}) manually fetched data for address '${address.hash}'`)
        return this.successResponse(address)
    }

    /**
     * Delete address by ID.
     */
    async destroy({ bouncer, params }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) return this.errorResponse(AppErrors.ADDRESS_NOT_FOUND)

        if (await bouncer.with(AddressPolicy).denies("destroy", address)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        await address.delete()
        return this.successResponse()
    }

    /**
     * Locks an address, preventing it from being used in any research stack.
     */
    async lock({ bouncer, params, auth }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) return this.errorResponse(AppErrors.ADDRESS_NOT_FOUND)

        if (await bouncer.with(AddressPolicy).denies("lock", address)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        address.isLocked = true
        await address.save()

        logger.debug(`user ${auth.user!.id} (${auth.user!.email}) paused address '${address.hash}'`)
        return this.successResponse(address)
    }

    /**
     * Unlocks an address, allowing it to be used in research stacks again.
     */
    async unlock({ bouncer, params, auth }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) return this.errorResponse(AppErrors.ADDRESS_NOT_FOUND)

        if (await bouncer.with(AddressPolicy).denies("unlock", address)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        address.isLocked = false
        await address.save()

        logger.debug(`user ${auth.user!.id} (${auth.user!.email}) unpaused address '${address.hash}'`)
        return this.successResponse(address)
    }
}
