import fs from "node:fs"
import path from "node:path"
import { PRIVATE_ENV } from "@app/config/env"
import WORKERS_CONFIG from "@app/config/workers"
import type { AddressSelectModel } from "@app/db/schema/address"
import type { AddressListSelectModel } from "@app/db/schema/addressList"
import { logger } from "@app/lib/base/utils/logger"
import { parseWithBigIntSupport, stringifyWithBigIntSupport } from "@app/workers/lib/json"
import type { AddressDump, AddressListDumpMetadata } from "@app/workers/lib/protocol"
import { getAddressesByAddressListId, saveLatestDumpId } from "@app/workers/lib/queries"

/**
 * Get the path of an address list dump file.
 * @param addressListId The ID of the address list the dump file corresponds to.
 * @returns The path to the address list dump file.
 */
export function getAddressListDumpFilePath(addressListId: string) {
    return path.join(WORKERS_CONFIG.dumpsDir, `${addressListId}.json`)
}

/**
 * Get the path of the metadata file for an address list dump (prevents reading an entire dump
 * just to get the ID and version).
 * @param addressListId The ID of the address list the metadata file corresponds to.
 * @returns The path to the address list metadata file.
 */
export function getAddressListDumpMetadataFilePath(addressListId: string) {
    return path.join(WORKERS_CONFIG.dumpsDir, `${addressListId}.meta.json`)
}

/**
 * Generates a list of address list IDs from the dump files (filters out metadata files).
 * @returns An array of address list IDs.
 */
export function getAddressListIdsFromDumpFiles(): string[] {
    if (!fs.existsSync(WORKERS_CONFIG.dumpsDir)) return []

    const dumpFiles = fs.readdirSync(WORKERS_CONFIG.dumpsDir)
    return dumpFiles
        .filter(file => file.endsWith(".json") && !file.endsWith(".meta.json"))
        .map(file => path.basename(file, ".json"))
}

/**
 * Generates the metadata for an address list dump.
 * @returns The generated metadata object.
 */
function generateAddressListDumpMetadata() {
    return {
        id: crypto.randomUUID(),
        version: PRIVATE_ENV.addressListDumpVersion,
    }
}

/**
 * Generates a list of address dumps from a list of addresses.
 * @param addressListId The ID of the address list the addresses belong to.
 * @param addresses An array of addresses to include in the dump.
 * @returns The generated address list dump object.
 */
function generateAddressDumpObject(addressListId: string, addresses: AddressSelectModel[]) {
    const addressDumps: AddressDump[] = addresses.map(address => ({
        id: address.id,
        name: address.name,
        network: address.network,
        type: address.type,
        value: address.value,
        preEncoding: address.preEncoding,
        isDisabled: address.isDisabled,
        addressListId: addressListId,
    }))

    return addressDumps
}

/**
 * Verifies if a dump exists and is up-to-date (latest version and same ID as the
 * address list's latest dump).
 * @param addressList The address list to check the dump for.
 * @returns True if the dump exists and is up-to-date, false otherwise.
 */
function isDumpUpToDate(addressList: AddressListSelectModel) {
    if (!addressList.latestDumpId) return false

    const dumpFilePath = getAddressListDumpFilePath(addressList.id)
    if (!fs.existsSync(dumpFilePath)) return false

    const dumpMetadataFilePath = getAddressListDumpMetadataFilePath(addressList.id)
    if (!fs.existsSync(dumpMetadataFilePath)) return false

    let metadata: AddressListDumpMetadata | undefined
    try {
        metadata = parseWithBigIntSupport(fs.readFileSync(dumpMetadataFilePath, "utf-8")) as AddressListDumpMetadata
    } catch {
        logger.error(`Failed to read address list dump metadata`, { data: addressList.id })
        return false
    }

    return metadata.id === addressList.latestDumpId && metadata.version === PRIVATE_ENV.addressListDumpVersion
}

/**
 * Saves the address list dump to a file, with the metadata saved separately (with a `.meta.json` extension)
 * skips if the dump exists and is already up-to-date.
 * @param addressList The address list to save the dump for.
 */
export async function saveAddressListDumpFiles(addressList: AddressListSelectModel) {
    if (isDumpUpToDate(addressList)) return

    const workerLogger = logger.withPrefix(`Worker ${addressList.id}`)
    const addresses = await getAddressesByAddressListId(addressList.id)

    if (!addresses || addresses.length === 0) {
        workerLogger.warn(`No addresses found for dump.`)
        return
    }

    const dumpMetadata = generateAddressListDumpMetadata()
    const dump = generateAddressDumpObject(addressList.id, addresses)

    try {
        await saveLatestDumpId(addressList.id, dumpMetadata.id)
    } catch (error) {
        throw new Error("An error occurred while saving the latest dump ID", { cause: error })
    }

    fs.mkdirSync(WORKERS_CONFIG.dumpsDir, { recursive: true })

    // Writing dump file before metadata to ensure metadata only exists if dump is successful
    fs.writeFileSync(getAddressListDumpFilePath(addressList.id), stringifyWithBigIntSupport(dump))
    fs.writeFileSync(getAddressListDumpMetadataFilePath(addressList.id), stringifyWithBigIntSupport(dumpMetadata))

    workerLogger.success(`Dump for address list ${addressList.id} has been saved.`)
}

/**
 * Deletes the address list dump file for a given address list ID.
 * @param addressListId The ID of the address list to delete the dump for.
 */
export function deleteAddressListDumpFile(addressListId: string) {
    const dumpFilePath = getAddressListDumpFilePath(addressListId)

    if (fs.existsSync(dumpFilePath)) {
        fs.unlinkSync(dumpFilePath)
        logger.success(`Dump for address list ${addressListId} has been deleted.`)
    } else {
        logger.warn(`No dump found for address list ${addressListId}.`)
    }
}

/**
 * Deletes the metadata file for a given address list ID.
 * @param addressListId The ID of the address list to delete the metadata for.
 */
export function deleteAddressListDumpMetadataFile(addressListId: string) {
    const metadataFilePath = getAddressListDumpMetadataFilePath(addressListId)

    if (fs.existsSync(metadataFilePath)) {
        fs.unlinkSync(metadataFilePath)
        logger.success(`Metadata for address list ${addressListId} has been deleted.`)
    } else {
        logger.warn(`No metadata found for address list ${addressListId}.`)
    }
}
