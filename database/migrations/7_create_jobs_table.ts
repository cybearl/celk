import { N_STR } from "#kernel/algorithms/secp256k1"
import { MAX_NAME_LENGTH } from "#lib/constants/database"
import { JobMode, JobStatus } from "#lib/constants/enums"
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class extends BaseSchema {
    protected tableName = "jobs"

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments("id").primary()

            table.string("name", MAX_NAME_LENGTH).notNullable()
            table.enum("mode", Object.values(JobMode)).notNullable().defaultTo(JobMode.FULL_RANDOM)
            table.string("lowerBound").notNullable().defaultTo("0x0")
            table.string("upperBound").notNullable().defaultTo(N_STR)
            table.json("storage").notNullable().defaultTo("{}")
            table.enum("status", Object.values(JobStatus)).notNullable().defaultTo(JobStatus.PENDING)
            table.integer("attempts").notNullable().defaultTo(0)
            table.string("result").nullable()
            table.json("error").nullable()

            // Relationships
            // Belongs to an address
            table.integer("address_id").unsigned().references("id").inTable("addresses").notNullable()

            // Belongs to a user
            table.integer("user_id").unsigned().references("id").inTable("users").notNullable()

            // Dates
            table.timestamp("created_at").notNullable()
            table.timestamp("updated_at").notNullable()
            table.timestamp("started_at").nullable()
            table.timestamp("stopped_at").nullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
