import errorCodes from "#lib/constants/errors"
import Controller from "#lib/templates/controller"
import { getAddressType } from "#lib/utils/addresses"
import { getUserRoles } from "#lib/utils/roles"
import Address from "#models/address"
import { RoleNames } from "#models/role"
import { addressCreationValidator } from "#validators/addresses_validator"
import { HttpContext } from "@adonisjs/core/http"

export default class AddressesController extends Controller {
    /**
     * Get all addresses.
     */
    async index() {}

    /**
     * Add a new address (also fetches its data).
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
     * Update address by ID.
     */
    async update({}: HttpContext) {
        // TODO
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
