"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable("manager_status", (table) => {
        table.increments("id").primary();
        table.string("customer_phone").unique().notNullable();
        table.string("manager_status").notNullable().defaultTo("OFF");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        // Foreign key to users table
        table.foreign("customer_phone").references("phone").inTable("users");
    });
}
async function down(knex) {
    return knex.schema.dropTable("manager_status");
}
