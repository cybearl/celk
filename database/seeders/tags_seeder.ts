import Tag from "#models/tag"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class extends BaseSeeder {
    static environment = ["development", "testing", "production"]

    async run() {
        await Tag.createMany([
            {
                name: "btcP2PKH",
                description: "Pay to Public Key Hash Address",
            },
            {
                name: "btcP2SH",
                description: "Pay to Script Hash Address",
            },
            {
                name: "btcP2WPKH",
                description: "Pay to Witness Public Key Hash Address",
            },
            {
                name: "btcP2WSH",
                description: "Pay to Witness Script Hash Address",
            },
            {
                name: "btcP2TR",
                description: "Pay to Taproot Address",
            },
        ])
    }
}
