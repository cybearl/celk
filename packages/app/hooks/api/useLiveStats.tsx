import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import type { DynamicConfigSelectModel } from "@app/db/schema/dynamicConfig"
import useInterval from "@app/hooks/useInterval"
import { getAddressLiveStats } from "@app/queries/addresses"
import { getAddressListLiveStats } from "@app/queries/addressLists"
import { getDynamicConfigLiveStats } from "@app/queries/dynamicConfig"
import { mutate } from "swr"

/**
 * Polls live worker-updated stats (attempts, closest match, private key presence) for all
 * cached entities at a given interval, patching only the changed fields in the SWR cache
 * without triggering a full revalidation.
 * @param refreshIntervalMs The polling interval in milliseconds, or null to disable polling.
 */
export function useLiveStats(refreshIntervalMs: number | null) {
    useInterval(() => {
        Promise.all([
            getDynamicConfigLiveStats().then(({ attempts }) =>
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
            getAddressLiveStats().then(data =>
                mutate(
                    ["addresses"],
                    (current: AddressSelectModel[] | undefined) =>
                        current?.map(address => {
                            const updated = data.find(d => d.id === address.id)

                            return updated
                                ? {
                                      ...address,
                                      attempts: updated.attempts,
                                      closestMatch: updated.closestMatch,
                                      encryptedPrivateKey: updated.encryptedPrivateKey,
                                  }
                                : address
                        }),
                    { revalidate: false },
                ),
            ),
            getAddressListLiveStats().then(data =>
                mutate(
                    ["address_lists"],
                    (current: AddressListSelectModel[] | undefined) =>
                        current?.map(list => {
                            const updated = data.find(d => d.id === list.id)

                            return updated
                                ? {
                                      ...list,
                                      attempts: updated.attempts,
                                      isEnabled: updated.isEnabled,
                                      averageHashRate: updated.averageHashRate,
                                  }
                                : list
                        }),
                    { revalidate: false },
                ),
            ),
        ])
    }, refreshIntervalMs)
}
