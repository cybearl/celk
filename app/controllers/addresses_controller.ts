import { getBitcoinAddressData } from "#lib/apis/bitcoin"
import errorCodes from "#lib/constants/errors"
import Controller from "#lib/templates/controller"
import { getAddressType } from "#lib/utils/addresses"
import { getUserRoles } from "#lib/utils/roles"
import Address from "#models/address"
import { RoleNames } from "#models/role"
import { addressCreationValidator } from "#validators/addresses_validator"
import { HttpContext } from "@adonisjs/core/http"
import { DateTime } from "luxon"

export default class AddressesController extends Controller {
    /**
     * Updates an address with its data from the blockchain.
     * @param address The address to update.
     */
    private async updateAddressData(address: Address) {
        if (address.type.startsWith("BTC")) {
            const addressData = await getBitcoinAddressData(address.hash)
            address.balance = addressData.final_balance / 1e8 // Convert from satoshis to BTC
            address.txCount = addressData.n_tx

            const lastTx = addressData.txs[0]
            address.lastUsedAt = DateTime.fromSeconds(lastTx.time)
        }

        address.fetchedAt = DateTime.now()
        await address.save()
    }

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
     * Add a new address (also fetches its data from the blockchain).
     */
    async store({ request, auth }: HttpContext) {
        const { hash, chainId } = await request.validateUsing(addressCreationValidator)

        const type = getAddressType(hash)
        if (!type) return this.errorResponse(errorCodes.INVALID_ADDRESS_TYPE)

        const address = await Address.create({
            type,
            hash,
            // TODO: bytecode
            chainId,
            userId: auth.user!.id,
        })

        await this.updateAddressData(address)
        return this.successResponse(address)
    }

    /**
     * Get address by ID.
     */
    async show({ params }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) {
            return this.errorResponse(errorCodes.ADDRESS_NOT_FOUND)
        }

        return this.successResponse({ address })
    }

    /**
     * Updates all addresses data.
     * @param interval The interval in minutes to fetch the data for (optional, defaults to 5 minutes).
     */
    async update({ params }: HttpContext) {
        let interval = 5
        if (params.interval && !Number.isNaN(Number.parseInt(params.interval))) {
            interval = Number.parseInt(params.interval)
        }

        const addresses = await Address.query().where(
            "fetchedAt",
            "<",
            DateTime.now().minus({ minutes: interval }).toSQL()
        )

        for (const address of addresses) {
            await this.updateAddressData(address)
        }

        return this.successResponse()
    }

    /**
     * Delete address by ID.
     */
    async destroy({ params }: HttpContext) {
        const address = await Address.find(params.address_id)
        if (!address) {
            return this.errorResponse(errorCodes.ADDRESS_NOT_FOUND)
        }

        await address.delete()
        return this.successResponse()
    }
}
