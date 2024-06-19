import errorCodes from "#lib/constants/errors"
import Controller from "#lib/templates/controller"
import { getAddressType } from "#lib/utils/addresses"
import { getUserRoles } from "#lib/utils/roles"
import Address from "#models/address"
import { RoleNames } from "#models/role"
import { addressCreationValidator } from "#validators/addresses_validator"
import { fetchBitcoinAddressData, fetchEthereumAddressData } from "#workers/address_data_worker"
import { HttpContext } from "@adonisjs/core/http"
import logger from "@adonisjs/core/services/logger"
import { DateTime } from "luxon"

export default class AddressesController extends Controller {
    /**
     * Get all addresses.
     */
    async index({ auth }: HttpContext) {
        const roles = await getUserRoles(auth)

        if (roles.includes(RoleNames.AdminRole)) {
            const addresses = await Address.all()
            return this.successResponse({ addresses })
        }

        const addresses = await Address.query().where("userId", auth.user!.id)
        return this.successResponse({ addresses })
    }

    /**
     * Add a new address.
     */
    async store({ request, auth }: HttpContext) {
        const { hash, chainId } = await request.validateUsing(addressCreationValidator)

        const type = getAddressType(hash)
        if (!type) return this.errorResponse(errorCodes.INVALID_ADDRESS_TYPE)

        const address = await Address.create({
            type,
            hash,
            chainId,
            userId: auth.user!.id,
        })

        return this.successResponse(address)
    }

    /**
     * Get address by ID.
     */
    async show({ params, auth }: HttpContext) {
        const roles = await getUserRoles(auth)

        if (roles.includes(RoleNames.AdminRole)) {
            const address = await Address.find(params.address_id)
            if (!address) return this.errorResponse(errorCodes.ADDRESS_NOT_FOUND)

            return this.successResponse({ address })
        }

        const address = await Address.query().where("userId", auth.user!.id).andWhere("id", params.address_id).first()
        if (!address) return this.errorResponse(errorCodes.ADDRESS_NOT_FOUND)

        return this.successResponse({ address })
    }

    /**
     * Update address data by ID.
     */
    async update({ params, auth }: HttpContext) {
        const roles = await getUserRoles(auth)

        let address: Address | null = null
        if (roles.includes(RoleNames.AdminRole)) address = await Address.find(params.address_id)
        else address = await Address.query().where("userId", auth.user!.id).andWhere("id", params.address_id).first()

        if (!address) return this.errorResponse(errorCodes.ADDRESS_NOT_FOUND)

        if (address.fetchedAt) {
            // Verify that the fetchedAt field is not < 10 seconds ago
            const diff = Math.abs(address.fetchedAt.diffNow("seconds").seconds)

            if (diff < 10) {
                logger.debug(`Address data for ${address.hash} was fetched too soon (${diff} seconds < 10 seconds)`)
                return this.errorResponse(errorCodes.ADDRESS_DATA_FETCHED_TOO_SOON)
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
    async destroy({ params }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) return this.errorResponse(errorCodes.ADDRESS_NOT_FOUND)

        await address.delete()
        return this.successResponse()
    }
}
