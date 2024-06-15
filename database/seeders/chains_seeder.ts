import Chain from "#models/chain"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing"]

    async run() {
        await Chain.createMany([
            {
                id: 0,
                name: "bitcoin",
                apiUrls: [],
                nativeCurrency: "BTC",
                explorerUrl: "https://blockchain.com",
            },
            {
                id: 1,
                name: "ethereum",
                apiUrls: ["https://mainnet.infura.io/v3"],
                nativeCurrency: "ETH",
                explorerUrl: "https://etherscan.io",
            },
        ])
    }
}
