/**
 * The base url for the Bitcoin API.
 */
const baseUrl = "https://blockchain.info/"

/**
 * Get the balance of one or multiple Bitcoin addresses.
 */
export async function getBalance(addresses: string[]) {
    const response = await fetch(`${baseUrl}balance?active=${addresses.join("|")}`)
    const data = await response.json()
}
