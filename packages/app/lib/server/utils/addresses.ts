import fs from "node:fs"
import { getAddressesByListId } from "@app/queries/addresses"

/**
 * Takes in a list of addresses and generates a dump file at the specified path.
 * @param addressListId The ID of the address list to include in the dump.
 * @param dumpPath The path where the dump file will be created.
 */
export default async function generateAddressListDump(addressListId: string, dumpPath: string): Promise<void> {
    const addresses = await getAddressesByListId(addressListId)
    const addressValues = addresses.map(address => address.value)

    fs.mkdirSync(dumpPath, { recursive: true })

    fs.writeFileSync(`${dumpPath}/addresses.json`, JSON.stringify(addressValues, null, 2))
}
