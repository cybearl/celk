import DYNAMIC_CONFIG from "@app/config/dynamicConfig"
import { PUBLIC_ENV } from "@app/config/env"
import scAddress, { type AddressSelectModel } from "@app/db/schema/address"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import scUserOptions, { type UserOptionsSelectModel } from "@app/db/schema/userOptions"
import { logger } from "@app/lib/base/utils/logger"
import { db } from "@app/lib/server/connectors/db"
import { sendBalanceCheckerFailureAlert } from "@app/lib/server/utils/emails"
import { dbGetDynamicConfig } from "@app/lib/server/utils/queries"
import { getBalanceCheckerRetryDelay } from "@app/lib/server/utils/time"
import { getBitcoinAddressBalance, getEthCompatibleAddressBalance } from "@app/lib/server/utils/web3"
import { ADDRESS_NETWORK } from "@cybearl/celk-protocol"
import { asc, eq, isNull, not } from "drizzle-orm"

class BalanceChecker {
    /**
     * The logger for the balance checker, aligned with the worker logger that
     * uses the format `<W-XXXXXXXX>`.
     */
    private readonly _balanceCheckerLogger = logger.withPrefix("BL-CHECKER")

    private _dynamicConfig: DynamicConfigSelectModel | null
    private _checkTimeout: ReturnType<typeof setTimeout> | null

    private _isChecking: boolean
    private _checkRetryCount: number
    private _hasCheckAlertBeenSent: boolean

    constructor() {
        this._dynamicConfig = null
        this._checkTimeout = null

        this._isChecking = false
        this._checkRetryCount = 0
        this._hasCheckAlertBeenSent = false
    }

    /**
     * Clears the timeout for the check operation.
     */
    private _clearTimeout(): void {
        if (this._checkTimeout) clearTimeout(this._checkTimeout)
        this._checkTimeout = null
    }

    /**
     * Retrieves all required data in parallel during fetching.
     */
    private async _fetchRequiredData(): Promise<void> {
        const [dynamicConfig] = await Promise.all([dbGetDynamicConfig()])
        this._dynamicConfig = dynamicConfig
    }

    /**
     * Fetches the address with oldest `balanceCheckedAt` date if all addresses have one,
     * otherwise, fetches the first address with a `null` `balanceCheckedAt`.
     * @returns The next address to check or null if none is found.
     */
    private async _fetchNextAddress(): Promise<AddressSelectModel | null> {
        const [addressWithNullBalanceCheckedAt] = await db.select().from(scAddress).where(isNull(scAddress.balance))

        if (addressWithNullBalanceCheckedAt) {
            return addressWithNullBalanceCheckedAt
        } else {
            const [addressWithOldestBalanceCheckedAt] = await db
                .select()
                .from(scAddress)
                .where(not(isNull(scAddress.balanceCheckedAt)))
                .orderBy(asc(scAddress.balanceCheckedAt))
                .limit(1)

            if (addressWithOldestBalanceCheckedAt) {
                return addressWithOldestBalanceCheckedAt
            }
        }

        return null
    }

    /**
     * Fetches the balance of an address depending on its network.
     * @param address The address to fetch the balance for.
     * @returns The balance of the address as a numeric, or null if an error
     * occurs or if the network is unsupported.
     */
    private async _fetchBalance(address: AddressSelectModel): Promise<string | null> {
        let balance: string | null = null

        switch (address.network) {
            case ADDRESS_NETWORK.BITCOIN:
                balance = await getBitcoinAddressBalance(address, this._balanceCheckerLogger)
                break
            case ADDRESS_NETWORK.ETHEREUM:
            case ADDRESS_NETWORK.POLYGON:
            case ADDRESS_NETWORK.BSC:
                balance = await getEthCompatibleAddressBalance(address, this._balanceCheckerLogger)
                break
            default:
                this._balanceCheckerLogger.error(`Unsupported address network: ${address.network}.`)
                return null
        }

        return balance
    }

    /**
     * Fetches the user options for the user owning a specific address.
     * @param address The address to fetch user options for.
     * @returns The user options for the specified address or null if not found.
     */
    private async _fetchUserOptions(address: AddressSelectModel): Promise<UserOptionsSelectModel | null> {
        const [userOptions] = await db
            .select()
            .from(scUserOptions)
            .where(eq(scUserOptions.userId, address.userId))
            .limit(1)

        return userOptions || null
    }

    /**
     * Updates the balance of an address in the database.
     * @param address The address to update.
     * @param balance The balance to update in the database (as a numeric).
     * @param disableAddress Whether to disable the address too.
     */
    private async _updateBalanceInDatabase(
        address: AddressSelectModel,
        balance: string,
        disableAddress: boolean,
    ): Promise<void> {
        if (!address) return

        await db
            .update(scAddress)
            .set({
                balance,
                isDisabled: disableAddress,
                balanceCheckedAt: new Date(),
            })
            .where(eq(scAddress.id, address.id))
            .execute()

        this._balanceCheckerLogger.success(`Updated balance for address '${address.value}'.`)
    }

    /**
     * Checks the balance of an address depending on its last checked date or if it
     * has not been checked before.
     */
    private async _check(): Promise<void> {
        if (this._isChecking) return
        this._isChecking = true

        try {
            await this._fetchRequiredData()

            if (!this._dynamicConfig) {
                throw new Error("An error occurred while fetching the dynamic application config.")
            }

            const nextAddress = await this._fetchNextAddress()

            if (nextAddress) {
                const balance = await this._fetchBalance(nextAddress)

                if (balance === null) {
                    this._balanceCheckerLogger.info(`No balance found for address '${nextAddress.id}', skipping...`)
                } else {
                    const userOptions = await this._fetchUserOptions(nextAddress)

                    // Automatically disable zero balance addresses for users that
                    // have the "autoDisableZeroBalance" option enabled
                    let disableAddress = false
                    if (userOptions?.autoDisableZeroBalance && balance === "0") {
                        disableAddress = true
                    }

                    await this._updateBalanceInDatabase(nextAddress, balance, disableAddress)
                }
            } else {
                this._balanceCheckerLogger.info(`No addresses found to check balance for, skipping...`)
            }

            // Reset retry states
            this._checkRetryCount = 0
            this._hasCheckAlertBeenSent = false

            // Loop for next check
            this._checkTimeout = setTimeout(() => this._check(), this._dynamicConfig.balanceCheckerDelayMs)
            this._isChecking = false
        } catch (error) {
            this._checkRetryCount++

            const maxRetries = this._dynamicConfig?.maxBalanceCheckerRetries ?? DYNAMIC_CONFIG.maxBalanceCheckerRetries

            this._balanceCheckerLogger.error(
                `An error occurred while checking the balance of an address (attempt ${this._checkRetryCount}).`,
                { data: error },
            )

            if (this._checkRetryCount >= maxRetries && !this._hasCheckAlertBeenSent) {
                try {
                    await sendBalanceCheckerFailureAlert(this._checkRetryCount, error)
                    this._hasCheckAlertBeenSent = true
                } catch (error) {
                    this._balanceCheckerLogger.error(`Failed to send check failure alert:`, { data: error })
                }
            }

            const retryDelay = getBalanceCheckerRetryDelay(this._dynamicConfig, this._checkRetryCount)
            this._balanceCheckerLogger.warn(`Retrying check in ${retryDelay.toLocaleString("en-US")}ms...`)

            this._isChecking = false
            this._clearTimeout()
            this._checkTimeout = setTimeout(() => this._check(), retryDelay)
        }
    }

    /**
     * Starting procedure for the balance fetcher.
     */
    async start(): Promise<void> {
        this._balanceCheckerLogger.info(`Starting balance fetcher...`)
        await this._check()
    }

    /**
     * Stop the balance fetcher.
     */
    stop(): void {
        this._clearTimeout()
    }
}

// Using a global variable to keep the same class instance in development (hot-reload)
const globalWorkersManager = global as unknown as { balanceChecker: BalanceChecker | undefined }

/**
 * The balance checker instance, either from the global variable or a new instance.
 */
export const balanceChecker = globalWorkersManager.balanceChecker ?? new BalanceChecker()

// Writing back to the global variable
if (PUBLIC_ENV.nodeEnv !== "production") globalWorkersManager.balanceChecker = balanceChecker
