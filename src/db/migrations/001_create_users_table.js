"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.string("phone").unique().notNullable();
        table.string("name");
        table.string("customer_name");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    return knex.schema.dropTable("users");
}
