import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import useInterval from "@app/hooks/useInterval"
import { getAddressAttempts } from "@app/queries/addresses"
import { getAddressListAttempts } from "@app/queries/addressLists"
import { getDynamicConfigAttempts } from "@app/queries/dynamicConfig"
import { mutate } from "swr"

/**
 * Polls the attempt counts for the config, addresses, and address lists at a given interval,
 * patching only the `attempts` field in each existing SWR cache without triggering a full revalidation.
 * @param refreshIntervalMs The polling interval in milliseconds, or null to disable polling.
 */
export function useAttemptsSync(refreshIntervalMs: number | null) {
    useInterval(() => {
        Promise.all([
            getDynamicConfigAttempts().then(({ attempts }) =>
                mutate(
                    ["config"],
                    (current: DynamicConfigSelectModel | undefined) =>
                        current
                            ? {
                                  ...current,
                                  attempts,
                              }
                            : current,
                    { revalidate: false },
                ),
            ),
            getAddressAttempts().then(data =>
                mutate(
                    ["addresses"],
                    (current: AddressSelectModel[] | undefined) =>
                        current?.map(address => {
                            const updated = data.find(d => d.id === address.id)

                            return updated
                                ? {
                                      ...address,
                                      attempts: updated.attempts,
                                  }
                                : address
                        }),
                    { revalidate: false },
                ),
            ),
            getAddressListAttempts().then(data =>
                mutate(
                    ["address_lists"],
                    (current: AddressListSelectModel[] | undefined) =>
                        current?.map(list => {
                            const updated = data.find(d => d.id === list.id)

                            return updated
                                ? {
                                      ...list,
                                      attempts: updated.attempts,
                                  }
                                : list
                        }),
                    { revalidate: false },
                ),
            ),
        ])
    }, refreshIntervalMs)
}
