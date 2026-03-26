import fs from "node:fs"
import path from "node:path"
import WORKERS_CONFIG from "@app/config/workers"
import type { AddressMatch } from "@app/lib/server/instrumentations/workersManager/protocol"

/**
 * Gets the file path for a match file for a specific address list.
 * @param addressListId The ID of the address list.
 * @returns The file path for the match file.
 */
export function getMatchFilePath(addressListId: string): string {
    return path.join(WORKERS_CONFIG.matchesDir, `${addressListId}-${Date.now()}.json`)
}

/**
 * Synchronously writes a match to the local matches directory, must be called
 * synchronously (not async) to ensure the file is written before
 * any async operations that could fail.
 * @param match The match to save.
 */
export function saveMatchLocally(match: AddressMatch): void {
    fs.mkdirSync(WORKERS_CONFIG.matchesDir, { recursive: true })
    fs.writeFileSync(getMatchFilePath(match.addressListId), JSON.stringify(match))
}
