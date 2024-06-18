import Chain from "#models/chain"
import logger from "@adonisjs/core/services/logger"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        logger.info("seeding chains..")

        await Chain.createMany([
            {
                id: 0,
                name: "bitcoin",
                nativeCurrency: "BTC",
                explorerUrl: "https://blockchain.com",
            },
            {
                id: 1,
                name: "ethereum",
                nativeCurrency: "ETH",
                explorerUrl: "https://etherscan.io",
            },
        ])
    }
}
