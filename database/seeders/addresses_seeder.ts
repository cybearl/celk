import logger from "@adonisjs/core/services/logger"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        // const addresses = [
        //     "14zfBQx95CP2iRxUuyouhqJsBzgj9iKt4X",
        //     "1MeUgutKkYiyy6rchnhs52c3y2XdjC9AMp",
        //     "15CDoDQrMDRnwtLtiMQe2pS3D1YK7Nj5Br",
        // ]

        // TODO: Implement address seeding

        logger.warn("Address seeding is not implemented yet, skipping...")
    }
}
