import { trpcClient } from "@app/lib/client/connectors/trpcClient"
import { mutate } from "swr"

/**
 * Retrieve the application dynamic application config by sending a query request to the tRPC API.
 * @returns The config object returned from the API.
 */
export async function getDynamicConfig() {
    return await trpcClient.dynamicConfig.get.query()
}

/**
 * Retrieve only the global attempt counts from the config by sending a query request to the tRPC API.
 * @returns An object containing the current attempts count.
 */
export async function getDynamicConfigAttempts() {
    return await trpcClient.dynamicConfig.getAttempts.query()
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
