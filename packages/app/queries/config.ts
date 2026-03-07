import { trpcClient } from "@app/lib/client/connectors/trpcClient"
import { mutate } from "swr"

/**
 * Retrieves the application config by sending a query request to the tRPC API.
 * @returns The config object returned from the API.
 */
export async function getConfig() {
    return await trpcClient.config.get.query()
}

/**
 * Updates the application config by sending a mutation request to the tRPC API.
 * @param data The updated config fields.
 * @returns The updated config object returned from the API.
 */
export async function updateConfig(data: Parameters<typeof trpcClient.config.update.mutate>[0]) {
    const config = await trpcClient.config.update.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "config")
    return config
}
