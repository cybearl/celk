import { getBitcoinAddressData, getEthereumAddressData, getEthereumBytecode } from "#lib/apis/web3"
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
     * Updates an address with its data.
     * @param address The address to update.
     * @returns The fetched address data.
     */
    static async updateAddressData(address: Address) {
        await address.load("chain")

        if (address.chain.name === "bitcoin") {
            const addressData = await getBitcoinAddressData(address.hash)
            address.balance = addressData.final_balance / 1e8 // Convert from satoshis to BTC
            address.txCount = addressData.n_tx

            const lastTx = addressData.txs[0]
            address.lastUsedAt = DateTime.fromSeconds(lastTx.time)
        } else if (address.chain.name === "ethereum") {
            address.bytecode = getEthereumBytecode(address.hash)

            const addressData = await getEthereumAddressData(address.hash)
            address.balance = addressData.balance
            address.txCount = addressData.txCount

            const lastTx = addressData.txs[0]
            address.lastUsedAt = DateTime.fromSeconds(Number(lastTx.timeStamp))
        }

        address.fetchedAt = DateTime.now()
        await address.save()

        return {
            balance: address.balance,
            txCount: address.txCount,
            lastUsedAt: address.lastUsedAt,
            fetchedAt: address.fetchedAt,
        }
    }

    /**
     * Get all addresses.
     */
    async index() {
        const addressData = await getBitcoinAddressData("0xf6952f61e736e444e644a7fb75d44ef4f81db5f4")
        console.log(addressData)
    }

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
            // TODO: bytecode
            chainId,
            userId: auth.user!.id,
        })

        await AddressesController.updateAddressData(address)
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
            await AddressesController.updateAddressData(address)
        }

        return this.successResponse()
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
