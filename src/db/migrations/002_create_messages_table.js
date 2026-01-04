"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable("messages", (table) => {
        table.increments("id").primary();
        table.string("customer_phone").notNullable();
        table.string("business_phone").notNullable();
        table.timestamp("timestamp").notNullable();
        table.jsonb("order_data");
        table.jsonb("matched_items");
        table.string("name");
        table.integer("flow_counter").defaultTo(0);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        // Foreign key to users table
        table.foreign("customer_phone").references("phone").inTable("users");
    });
}
async function down(knex) {
    return knex.schema.dropTable("messages");
}
