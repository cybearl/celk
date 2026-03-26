import type { AddressSelectModel } from "@app/db/schema/address"
import useInterval from "@app/hooks/useInterval"
import { getAddressBalances } from "@app/queries/addresses"
import { mutate } from "swr"

/**
 * Polls the address balances at a given interval, patching only the `balance` field in
 * each existing SWR cache without triggering a full revalidation.
 * @param refreshIntervalMs The polling interval in milliseconds, or null to disable polling.
 */
export function useBalancesSync(refreshIntervalMs: number | null) {
    useInterval(() => {
        getAddressBalances().then(data =>
            mutate(
                ["addresses"],
                (current: AddressSelectModel[] | undefined) =>
                    current?.map(address => {
                        const updated = data.find(d => d.id === address.id)

                        return updated
                            ? {
                                  ...address,
                                  balance: updated.balance,
                                  balanceCheckedAt: updated.balanceCheckedAt,
                              }
                            : address
                    }),
                { revalidate: false },
            ),
        )
    }, refreshIntervalMs)
}
