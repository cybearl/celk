import { trpcClient } from "@app/lib/client/connectors/trpcClient"
import { mutate } from "swr"

/**
 * Retrieves the application dynamic application config by sending a query request to the tRPC API.
 * @returns The config object returned from the API.
 */
export async function getDynamicConfig() {
    return await trpcClient.dynamicConfig.get.query()
}

/**
 * Retrieves the dynamic application config global live stats.
 * @returns An object containing the current global live stats.
 */
export async function getDynamicConfigLiveStats() {
    return await trpcClient.dynamicConfig.getLiveStats.query()
}

/**
 * Updates the application dynamic application config by sending a mutation request to the tRPC API.
 * @param data The updated dynamic application config fields.
 * @returns The updated dynamic application config object returned from the API.
 */
export async function updateDynamicConfig(data: Parameters<typeof trpcClient.dynamicConfig.update.mutate>[0]) {
    const config = await trpcClient.dynamicConfig.update.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "config")
    return config
}
