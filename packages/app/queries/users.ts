import { trpcClient } from "@app/lib/client/connectors/trpcClient"
import { mutate } from "swr"

/**
 * Updates the current user's username and name by sending a mutation request to the tRPC API.
 * @param data The updated username and name.
 * @returns The updated user object returned from the API.
 */
export async function updateUserInfo(data: Parameters<typeof trpcClient.users.updateInfo.mutate>[0]) {
    const user = await trpcClient.users.updateInfo.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "users")
    return user
}

/**
 * Delete the current user's account by sending a mutation request to the tRPC API.
 */
export async function deleteUserAccount() {
    await trpcClient.users.deleteAccount.mutate()
    await mutate(key => Array.isArray(key) && key[0] === "users")
}

/**
 * Sets the roles of a user by sending a mutation request to the tRPC API.
 * @param data The user ID and the role slugs to assign.
 */
export async function setUserRoles(data: Parameters<typeof trpcClient.users.setRoles.mutate>[0]) {
    await trpcClient.users.setRoles.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "users")
}

/**
 * Sets the locked state of a user by sending a mutation request to the tRPC API.
 * @param data The user ID and the locked state to set.
 */
export async function setUserLocked(data: Parameters<typeof trpcClient.users.setLocked.mutate>[0]) {
    await trpcClient.users.setLocked.mutate(data)
    await mutate(key => Array.isArray(key) && key[0] === "users")
}
