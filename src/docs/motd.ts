import dedent from "dedent-js";

import logger from "lib/utils/logger";


/**
 * Prints the application's message of the day.
 */
export default function motd() {
    console.log("");
    logger.info(dedent`
        █▀▀ █▀▀ █░░ █▄▀ ░ ░░█ █▀   ▄▄   █░█ ▄█ ░ █▀█ █▀█
        █▄▄ ██▄ █▄▄ █░█ ▄ █▄█ ▄█   ░░   ▀▄▀ ░█ ▄ █▄█ ▀▀█
    `);
    console.log("");
}