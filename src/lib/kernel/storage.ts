import fs from "fs";

import { LocalStorage } from "node-localstorage";

import envPaths from "lib/utils/envPaths";


/**
 * Creates a new storage for Celk, depending on the environment.
 * @returns The created storage.
 */
export default function createStorage() {
    let appName = "celk";
    if (process.env.NODE_ENV === "development") appName += " (development)";
    else if (process.env.NODE_ENV === "test") appName += " (test)";

    const paths = envPaths(appName);

    if (!fs.existsSync(paths.data)) {
        fs.mkdirSync(paths.data, { recursive: true });
    }

    return new LocalStorage(paths.data);
}